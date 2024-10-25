import React, { useState } from "react";
import { TextField, InputLabel, FormControl, NativeSelect, Box, Button } from "@mui/material";
import styles from "./Profile.module.css";
import { updateUser } from "../../api/userService";

const Profile: React.FC = () => {
  const [Name, setName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<number | string>();
  const [channelLinks, setChannelLinks] = useState<string>("");
  const [error, setError] = useState<string | null>(null);


  const handleChannelLinkChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setChannelLinks(e.target.value);
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await updateUser({ Name, phoneNumber, channelLinks });
      if (response.status === 200) {
        setError("Details updated successfully");
        
        localStorage.setItem('user', JSON.stringify(response.data.youtuber));
          } else {
            setError(`Error updating details`);
          }

      } catch (error) {
        setError("Error updating details");
      }
    }

  return (
    <div>
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <TextField variant="standard" required label="Name" type="text" name="name" value={Name} onChange={(e) => setName(e.target.value)} />
      <TextField variant="standard" label="Phone Number (with country code)" type="text" name="phoneNum" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
      {/* <TextField variant="standard" required label="About" type="textarea" multiline name="about" value={about || ''} onChange={(e) => setAbout(e.target.value)} /> */}
      <TextField variant="standard" required label="Channel Link" type="text" name="channelLink" value={channelLinks || ''} onChange={(e) => handleChannelLinkChange(e)} />
      {/* {channelLinks.slice(1).map((link, index) => (
      <TextField variant="standard" key={index + 1} label={`Channel Link ${index + 2}`} type="text" value={link} onChange={(e) => handleChannelLinkChange(e, index + 1)} />
      ))}
      {channelLinks.length < 3 && (
      <Button onClick={addChannelLink}>Add Channel Link</Button>
      )} */}
      <p style={{ color: error === "Details updated successfully" ? 'blue' : 'red' }}>{error}</p>
      <Button type="submit">Submit</Button>
    </form>
    </div>
  );
};

export default Profile;
