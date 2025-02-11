import { FC, useCallback, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getClips } from 'src/common/api'
import { setClipIndex, setClips, setCurrentClip, setCurrentSearch, updateClips } from 'src/state/reducer'
import { useStateValue } from 'src/state/state'
import { searchClips } from 'src/types/search'
import './player.scss'

const Player: FC = () => {
	const [{ clips, currentClip, clipIndex, currentSearch }, dispatch] = useStateValue()
	const params = useParams<searchClips>()

	const firstLoad = useCallback(async () => {
		console.log('first load call')
		const data = await getClips(params)

		dispatch(setClips(data))
		dispatch(setCurrentClip(data.data[0]))
		dispatch(setClipIndex(0))
		dispatch(setCurrentSearch(params))
	}, [dispatch, params])

	useEffect(() => {
		firstLoad()
	}, [firstLoad])

	const nextClip = useCallback(
		(direction?: string) => {
			const clipsData = clips.data
			const newClipIndex = direction === 'prev' ? clipIndex - 1 : clipIndex + 1

			dispatch(setCurrentClip(clipsData[newClipIndex]))
			dispatch(setClipIndex(newClipIndex))
		},
		[clipIndex, clips, dispatch]
	)

	const loadMoreClips = useCallback(async () => {
		const after = clips.pagination.cursor

		const newClips = await getClips(currentSearch, after)

		dispatch(updateClips(newClips))
	}, [clips, currentSearch, dispatch])

	useEffect(() => {
		const clipsTotal = clips.data.length

		//Starts the Autoplay if the clips have been set and none has played yet
		if (clipsTotal > 0 && clipIndex === -1) {
			nextClip()
		}

		//When there are clips and the currentClip is reaching the last fetch more
		if (clipsTotal > 0 && clipIndex + 3 > clipsTotal) {
			loadMoreClips()
		}
	}, [clips, clipIndex, nextClip, loadMoreClips])

	return (
		<>
			{currentClip.video_url && (
				<div className='player-container'>
					<h4 className='title-lg'>{currentClip.title}</h4>
					<video
						title='video-embed'
						width={600}
						src={currentClip.video_url}
						autoPlay={true}
						controls={true}
						onEnded={() => nextClip()}
					></video>

					{currentClip.comments_url && (
						<a href={`https://reddit.com${currentClip.comments_url}`} target='_blank' rel='noreferrer'>
							Reddit Link
						</a>
					)}

					{clips.data.length > 0 && clipIndex > 0 && (
						<button onClick={() => nextClip('prev')}>Previous Clip</button>
					)}
					{clips.data.length > clipIndex + 1 && <button onClick={() => nextClip()}>Next Clip</button>}
				</div>
			)}
		</>
	)
}

export default Player
