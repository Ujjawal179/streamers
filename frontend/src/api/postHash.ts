import axios from "axios";

// Placeholder for potential future use
export const postHash = async (hash: string): Promise<void> => {
    try {
        const response = await axios.post('http://localhost:3001/api/receive-hash', { hash });

        if (response.status === 200) {
            console.log('\nHash posted to API successfully!');
        } else {
            console.error('\nFailed to send hash to API');
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('\nError posting hash to API: ' + (error.response?.data?.message || error.message));
        } else {
            console.error('\nUnexpected error: ' + (error as Error).message);
        }
    }
};