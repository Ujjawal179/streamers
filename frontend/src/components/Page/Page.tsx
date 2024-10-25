
import React, { useEffect, useState } from 'react';

function Page({ page }: { page: string }) {
    const [content, setContent] = useState('');

    useEffect(() => {
        // Fetch the content of the HTML file
        fetch(`${page}.htm`)
            .then((response) => {
                if (response.ok) return response.text();
                throw new Error('Failed to fetch the file');
            })
            .then((text) => setContent(text))
            .catch((error) => console.error(error));
    }, [page]);

    return (
        <div style={{ margin: "auto", width: '95%', maxWidth: '800px', marginTop: '20px' }}>
            {/* Use dangerouslySetInnerHTML to display HTML content */}
            <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
    );
}

export default Page;
