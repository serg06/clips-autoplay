export const getFavourites = () => {}

export const addFavourite = (channel: string) => {
	const storedFavourites = JSON.parse(localStorage.getItem('favourites') || '[]')

	console.log(storedFavourites)

	localStorage.setItem('favourites', JSON.stringify(newFavourites))
}
