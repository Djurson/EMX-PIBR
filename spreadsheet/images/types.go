package images

// ImageRow is one matched product's image URLs to download, keyed by its EMX
// article number so downloaded files can be renamed to it.
type ImageRow struct {
	EMXArticleNumber string
	URLs             []string
}
