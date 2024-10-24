import React, { useEffect, useState } from 'react';
import { fetchPaymentsForYoutuber } from '../../api/userService';

const YoutuberPayments = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}').user;
  const youtuberId = user ? user.id : null;
  interface Payment {
    amount: number;
    currency: string;
    status: string;
    orderId: string;
    createdAt: string;
  }

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getPayments = async () => {
      const paymentData = await fetchPaymentsForYoutuber(youtuberId as string);
      if (paymentData) {
        setPayments(paymentData);
      }
      setLoading(false);
    };

    getPayments();
  }, [youtuberId]);

  if (loading) {
    return <div>Loading payments...</div>;
  }

  return (
    <div>
      <h2>Payments for Youtuber {youtuberId}</h2>
      <ul>
        {payments.map((payment, index) => (
          <li key={index}>
            <strong>Amount:</strong> {payment.amount} {payment.currency}<br />
            <strong>Status:</strong> {payment.status}<br />
            <strong>Order ID:</strong> {payment.orderId}<br />
            <strong>Date:</strong> {new Date(payment.createdAt).toLocaleDateString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default YoutuberPayments;
