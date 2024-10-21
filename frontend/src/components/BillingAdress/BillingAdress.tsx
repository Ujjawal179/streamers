import React, { useState } from "react";
import { TextField, InputLabel, FormControl, NativeSelect, Box, Button } from "@mui/material";
import styles from "./Profile.module.css";

const BillingAdress: React.FC = () => {
  const [Name, setName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<number | string>();
  const [about, setAbout] = useState< string>("");
  const [channelLinks, setChannelLinks] = useState<string[]>([]);

  const addChannelLink = () => {
    setChannelLinks([...channelLinks, ""]);
  };

  const handleChannelLinkChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => {
      const newChannelLinks = [...channelLinks];
      newChannelLinks[index] = e.target.value;
      setChannelLinks(newChannelLinks);
    };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const profileData = {
      Name,
      phoneNumber,
      about,
      channelLinks,
    };
    console.log(profileData);
    // You can add further logic to handle the form submission, such as sending the data to a server
  };

  return (
    <div>
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <TextField variant="standard" required label="Name" type="text" name="name" value={Name} onChange={(e) => setName(e.target.value)} />
      <TextField variant="standard" label="Phone Number (with country code)" type="text" name="phoneNum" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
      <TextField variant="standard" required label="About" type="textarea" multiline name="about" value={about || ''} onChange={(e) => setAbout(e.target.value)} />
      <TextField variant="standard" required label="Channel Link 1" type="text" name="mandatoryChannelLink" value={channelLinks[0] || ''} onChange={(e) => handleChannelLinkChange(e, 0)} />
      {channelLinks.slice(1).map((link, index) => (
      <TextField variant="standard" key={index + 1} label={`Channel Link ${index + 2}`} type="text" value={link} onChange={(e) => handleChannelLinkChange(e, index + 1)} />
      ))}
      {channelLinks.length < 3 && (
      <Button onClick={addChannelLink}>Add Channel Link</Button>
      )}
      <Button type="submit">Submit</Button>
    </form>
    </div>
  );
};

export default BillingAdress;
