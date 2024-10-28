import React, { useState } from "react";
import { TextField, Button } from "@mui/material";
import { updateUser } from "../../api/userService";

const BillingAdress: React.FC = () => {
  const [timeout, setTimeout] = useState<number>();
  const [charge, setCharge] = useState<number >();
  const [error, setError] = useState<string | null>(null);


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if(!charge || !timeout) {
        setError("Please fill all the fields");
        return;
      }
      if(charge <= 10 || timeout <= 10) {
        setError("Charge and Timeout should be greater than 10");
        return;
      }
      const response = await updateUser({ charge, timeout });
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
      <TextField variant="standard" required label="Cost per Second" type="number" name="charge" value={charge} onChange={(e) => setCharge(Number(e.target.value))} />
      <TextField variant="standard" label="Time Gap between 2 Ads" type="number" name="timeout" value={timeout} onChange={(e) => setTimeout(Number(e.target.value))} />
      <p style={{ color: error === "Details updated successfully" ? 'blue' : 'red' }}>{error}</p>
      <Button type="submit">Submit</Button>
    </form>
    </div>
  );
};

export default BillingAdress;
