import { FC, useCallback, useEffect, useState } from 'react'
import {useParams } from 'react-router-dom'
import { getClips } from 'src/common/api'
import {
	setClipIndex,
	setClips,
	setCurrentClip,
	setCurrentSearch,
	setFavourites,
	updateClips,
} from 'src/state/reducer'
import { useStateValue } from 'src/state/state'
import { searchClips } from 'src/types/search'
import { ChevronRightIcon,  } from '@primer/octicons-react'
import redditLogo from '../../assets/logo-reddit.svg'
import ReactGA from 'react-ga'

import './player.scss'
import 'src/styles/button-generic.scss'

import Loader from '../common/loader/Loader'
import { addFavourite, getFavourites } from 'src/common/localstorage'
import PlayerError from './PlayerError'
import PlayerFinished from './PlayerFinished'

const Player: FC = () => {
	const [{ clips, currentClip, clipIndex, currentSearch }, dispatch] = useStateValue()
	const [transition, setTransition] = useState('loading')
	const [error, setError] = useState(false)
	const [finished, setFinished] = useState(false)
	const [videoMaxWidth, setVideoMaxWidth] = useState(1200)
	const [loadingClips, setLoadingClips] = useState(false)
	const params = useParams<searchClips>()

	useEffect(() => {
		ReactGA.pageview(window.location.pathname + window.location.search)
	}, [params])

	useEffect(() => {
		setTransition('loading')

		const getdata = async () => {
			dispatch(setClipIndex(0))
			dispatch(setCurrentSearch(params))

			const data = await getClips(params)

			if ('error' in data) {
				setError(true)
				setTransition('')
			} else {
				dispatch(setClips(data))
				dispatch(setCurrentClip(data.data[0]))
				setFinished(false)
				await addFavourite(params)
				const favouritesRes = await getFavourites()

				dispatch(setFavourites(favouritesRes))
			}
		}

		getdata()

		return () => {
			dispatch(
				setCurrentClip({
					title: '',
					video_url: '',
					comments_url: '',
				})
			)
			setTransition('loading')
		}
	}, [dispatch, params])

	useEffect(() => {

		const video = document.querySelector('.player-container video')
		const vh = window.innerHeight

		const updateVideoSize = () => {
			if(video?.clientHeight){
				if(video?.clientHeight + 270 > vh) {
					setVideoMaxWidth((vh - 270) * 1.69)
				}
			}
		}

		updateVideoSize()

		window.onresize = updateVideoSize
		
	}, [])

	const nextClip = useCallback(
		(direction?: string) => {
			const clipsData = clips.data
			const newClipIndex = direction === 'prev' ? clipIndex - 1 : clipIndex + 1

			if (newClipIndex + 1 <= clips.data.length) {
				//Twitch pagination sometimes sends the same clip as the last in the payload and first in the next
				if (clipsData[clipIndex].video_url === clipsData[newClipIndex].video_url) {
					nextClip()
				} else {
					setTransition('loading')

					dispatch(setCurrentClip(clipsData[newClipIndex]))
					dispatch(setClipIndex(newClipIndex))
				}
			} else {
				setFinished(true)
				setTransition('')
			}
		},
		[clipIndex, clips, dispatch]
	)

	const loadMoreClips = useCallback(async () => {
		const after = clips.pagination.cursor
		console.log('moreclips called')
		if (after !== '' && !loadingClips) {
			setLoadingClips(true)
			console.log('loading clips')
			const data = await getClips(currentSearch, after)

			if ('error' in data) {
				console.log(data.error)
			} else {
				dispatch(updateClips(data))
				setLoadingClips(false)
			}
		}
	}, [clips.pagination.cursor, currentSearch, dispatch, loadingClips])

	useEffect(() => {
		const clipsTotal = clips.data.length
		//Starts the Autoplay if the clips have been set and none has played yet
		if (clipsTotal > 0 && clipIndex === -1) {
			nextClip()
		}

		//When there are clips and the currentClip is reaching the last fetch more
		//------Todo - Increase Margin before deploy
		if (clipsTotal > 0 && clipIndex + 3 > clipsTotal) {
			loadMoreClips()
		}
	}, [clips, clipIndex, nextClip, loadMoreClips])

	return (
		<>
			<div className='player-container' style={{ maxWidth: videoMaxWidth}}>
				{finished && (
					<PlayerFinished />
				)}
				{currentClip.video_url && (
					<>
						<div className='video-controls'>
							<h4 className='title-lg'>{currentClip.title}</h4>

							<div className='right-container'>
								{currentClip.comments_url && (
									<a
										className='link-comments'
										href={`https://reddit.com${currentClip.comments_url}`}
										target='_blank'
										rel='noreferrer'
										title='clip comments'
									>
										<img className='' width='25' src={redditLogo} alt='reddit logo' />
									</a>
								)}
								<button
									className='btn-clips-control btn-left'
									onClick={() => nextClip('prev')}
									disabled={clipIndex <= 0}
								>
									Previous
									<i className='icon-container'>
										<ChevronRightIcon size={20} />
									</i>
								</button>

								<button
									className='btn-clips-control btn-right'
									onClick={() => nextClip()}
									disabled={clips.data.length <= clipIndex + 1}
								>
									Next
									<i className='icon-container'>
										<ChevronRightIcon size={20} />
									</i>
								</button>
							</div>
						</div>

						<video
							className={transition}
							src={currentClip.video_url}
							autoPlay={true}
							controls={true}
							onEnded={() => nextClip()}
							onLoadedData={() => setTransition('')}
							onError={() => nextClip()}
						></video>
					</>
				)}
				{error && (
					<PlayerError/>
				)}

				
				<Loader visible={transition} />
			</div>
		</>
	)
}

export default Player
