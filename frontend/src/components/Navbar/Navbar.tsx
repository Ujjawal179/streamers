import React, { useEffect, useState } from 'react';

function Navbar() {
    const [user, setUser] = useState(null);

    // On component mount, check localStorage for user
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser)); // Parse and set user if exists
        }
    }, []);

    return (
        <>
            <div
                style={{
                    position: 'sticky',
                    top: 0,
                    height: '3rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0 1rem',
                    boxShadow: '0px 0px 4px 0px',
                    backgroundColor: 'white',
                    zIndex: 1000,
                }}
            >
                <a href="/" style={{ textDecoration: 'none', color: 'black' }}>
                    <h2 className="logo">streamers</h2>
                </a>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignContent: 'center',
                        gap: '1rem',
                    }}
                >
                    {user ? (
                        <a href="/dashboard" style={{ textDecoration: 'none', color: 'black' }}>
                            Dashboard
                        </a>
                    ) : (
                        <>
                            <a href="/login" style={{ textDecoration: 'none', color: 'black' }}>
                                Login
                            </a>
                            <a href="/signup" style={{ textDecoration: 'none', color: 'black' }}>
                                Sign Up
                            </a>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

export default Navbar;