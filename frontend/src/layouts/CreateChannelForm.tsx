import { useEffect, useState } from "react";
import { IUser } from "../types/IUser";

interface CreateChannelFormProps {
	createChannelNameInputValue: string;
	createChannelPasswordInputValue: string;
	setCreateChannelNameInputValue: (arg0: string) => void;
	setCreateChannelPasswordInputValue: (arg0: string) => void;
	createChannel: (arg0: string, arg1: string, arg2: boolean) => void;
	close: (arg0: string) => void;
}

const CreateChannelForm = ({
	createChannelNameInputValue,
	createChannelPasswordInputValue,
	setCreateChannelNameInputValue,
	setCreateChannelPasswordInputValue,
	createChannel,
	close }: CreateChannelFormProps) => {

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Enter') {
			event.preventDefault();
			createChannel(createChannelNameInputValue, createChannelPasswordInputValue, false);
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name } = e.target;
		if (name === "name") {
			setCreateChannelNameInputValue(e.target.value);
		}
		if (name === "channelPassword") {
			setCreateChannelPasswordInputValue(e.target.value);
		}
	};

	return (
		<form id="form_create_channel">
			<button type="button" className="button_close_create_channel" onClick={() => close("form_create_channel")}>
				✕
			</button>
			<label id="label_create_channel" htmlFor="text">
				<b>Channel Name</b>
			</label>
			<input
				className="input_create_channel"
				type="text"
				placeholder="Channel Name"
				name="name"
				value={createChannelNameInputValue}
				onKeyDown={handleKeyDown}
				onChange={(e) => handleInputChange(e)}
			/>

			<label id="label_create_channel" htmlFor="psw">
				<b>Password</b>
			</label>
			<input
				className="input_create_channel"
				type="password"
				placeholder="Channel Password"
				name="channelPassword"
				value={createChannelPasswordInputValue}
				onKeyDown={handleKeyDown}
				onChange={(e) => handleInputChange(e)}
			/>
			<button type="button" id="button_create_channel" onClick={() => createChannel(createChannelNameInputValue, createChannelPasswordInputValue, false)}>
				Create Channel
			</button>
		</form>
	);
};

export default CreateChannelForm;
