import React, { FC } from 'react'

interface Props {
	id: string
	name: string
	label: string
	checked: boolean
	value: string
	onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

const RadioCustom: FC<Props> = ({ id, name, label, checked, value, onChange }) => {
	return (
		<div className='radio-wrapper'>
			<input id={id} type='radio' name={name} checked={checked} value={value} onChange={onChange} />
			<label htmlFor={id}>{label}</label>
		</div>
	)
}

export default RadioCustom
