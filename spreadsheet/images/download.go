package images

import (
	"crypto/sha256"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"spix/utils/logging"
)

// DownloadImages downloads every row's images into outDir, sequentially. A
// failed image is recorded and skipped rather than aborting the run — one
// 404 or timeout shouldn't stop the rest of the batch from downloading. All
// failures are returned together as a single joined error.
func DownloadImages(imageRows []ImageRow, outDir string) error {
	var errs []error
	for _, row := range imageRows {
		if err := downloadRow(row, outDir); err != nil {
			errs = append(errs, fmt.Errorf("row %s: %w", row.EMXArticleNumber, err))
		}
	}
	return errors.Join(errs...)
}

// fetchedImage is one URL's downloaded bytes, kept in memory until dedup and
// naming are resolved for the whole row.
type fetchedImage struct {
	data []byte
	ext  string
}

// downloadRow fetches every URL in row, then writes the ones with distinct
// content to outDir — named after EMXArticleNumber, with a _1, _2, ...
// suffix when more than one image survives dedup. Suppliers often list the
// same picture twice under different links (e.g. a direct CDN URL and a
// Dropbox mirror); hashing the bytes catches that even though the URLs
// differ. A failed URL is recorded and skipped so the rest of the row still
// downloads.
func downloadRow(row ImageRow, outDir string) error {
	var errs []error
	seen := make(map[[32]byte]bool, len(row.URLs))
	unique := make([]fetchedImage, 0, len(row.URLs))

	for _, rawURL := range row.URLs {
		img, err := fetchImage(rawURL)
		if err != nil {
			logging.Log.Error("download failed", "emxArticleNumber", row.EMXArticleNumber, "url", rawURL, "err", err)
			errs = append(errs, fmt.Errorf("url %q: %w", rawURL, err))
			continue
		}

		hash := sha256.Sum256(img.data)
		if seen[hash] {
			continue // same image bytes as another URL already kept for this row
		}
		seen[hash] = true
		unique = append(unique, img)
	}

	for i, img := range unique {
		name := row.EMXArticleNumber
		if len(unique) > 1 {
			name = fmt.Sprintf("%s_%d", name, i+1)
		}
		if err := saveImage(img, outDir, name); err != nil {
			logging.Log.Error("save failed", "name", name, "err", err)
			errs = append(errs, fmt.Errorf("save %s: %w", name, err))
		}
	}

	return errors.Join(errs...)
}

// fetchImage downloads rawURL fully into memory and resolves its extension
// from the URL path or, failing that, by sniffing the response body.
func fetchImage(rawURL string) (fetchedImage, error) {
	u, err := url.Parse(rawURL)
	if err != nil {
		return fetchedImage{}, err
	}
	resolved := resolveDownloadURL(u)

	resp, err := http.Get(resolved)
	if err != nil {
		return fetchedImage{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fetchedImage{}, fmt.Errorf("status %d", resp.StatusCode)
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return fetchedImage{}, err
	}

	ext := filepath.Ext(u.Path)
	if ext == "" {
		ext = extFromContentType(http.DetectContentType(data))
	}

	return fetchedImage{data: data, ext: ext}, nil
}

// saveImage writes img to outDir/name.<ext>.
func saveImage(img fetchedImage, outDir, name string) error {
	if err := os.MkdirAll(outDir, 0o755); err != nil {
		return err
	}

	out, err := os.Create(filepath.Join(outDir, name+img.ext))
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = out.Write(img.data)
	return err
}

// resolveDownloadURL rewrites known share-link hosts (e.g. Dropbox) so the
// request returns raw file bytes instead of an HTML preview page.
func resolveDownloadURL(u *url.URL) string {
	if strings.Contains(u.Host, "dropbox.com") {
		q := u.Query()
		q.Set("dl", "1")
		u.RawQuery = q.Encode()
	}
	return u.String()
}

// extFromContentType maps a sniffed MIME type to a file extension, defaulting
// to ".jpg" when unrecognized.
func extFromContentType(contentType string) string {
	switch strings.SplitN(contentType, ";", 2)[0] {
	case "image/png":
		return ".png"
	case "image/gif":
		return ".gif"
	case "image/webp":
		return ".webp"
	default:
		return ".jpg"
	}
}
