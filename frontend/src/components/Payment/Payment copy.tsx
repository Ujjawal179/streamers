import * as React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import Paper from '@mui/material/Paper';
import { TableVirtuoso } from 'react-virtuoso';
import { fetchPaymentsForYoutuber } from '../../api/userService';
import { useState } from 'react';

interface Data {
  id: number;
  dessert: string;
  calories: number;
  fat: number;
  carbs: number;
  protein: number;
}

const sample: [string, number, number, number, number][] = [
  ['Frozen yoghurt', 159, 6.0, 24, 4.0],
  ['Ice cream sandwich', 237, 9.0, 37, 4.3],
  ['Eclair', 262, 16.0, 24, 6.0],
  ['Cupcake', 305, 3.7, 67, 4.3],
  ['Gingerbread', 356, 16.0, 49, 3.9],
];

function createData(id: number, dessert: string, calories: number, fat: number, carbs: number, protein: number): Data {
  return { id, dessert, calories, fat, carbs, protein };
}

const columns = [
  {
    width: 200,
    label: 'Dessert',
    dataKey: 'dessert',
  },
  {
    width: 120,
    label: 'Calories\u00A0(g)',
    dataKey: 'calories',
    numeric: true,
  },
  {
    width: 120,
    label: 'Fat\u00A0(g)',
    dataKey: 'fat',
    numeric: true,
  },
  {
    width: 120,
    label: 'Carbs\u00A0(g)',
    dataKey: 'carbs',
    numeric: true,
  },
  {
    width: 120,
    label: 'Protein\u00A0(g)',
    dataKey: 'protein',
    numeric: true,
  },
];

const rows: Data[] = Array.from({ length: 200 }, (_, index) => {
  const randomSelection = sample[Math.floor(Math.random() * sample.length)];
  return createData(index, ...randomSelection);
});

const VirtuosoTableComponents = {
  Scroller: React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => (
    <TableContainer component={Paper} {...props} ref={ref} />
  )),
  Table: (props: React.HTMLAttributes<HTMLTableElement>) => (
    <Table {...props} sx={{ borderCollapse: 'separate', tableLayout: 'fixed' }} />
  ),
  TableHead: React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>((props, ref) => <TableHead {...props} ref={ref} />),
  TableRow,
  TableBody: React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>((props, ref) => <TableBody {...props} ref={ref} />),
};

function fixedHeaderContent() {

  return (
    <TableRow>
      {columns.map((column) => (
        <TableCell
          key={column.dataKey}
          variant="head"
          align={column.numeric ? 'right' : 'left'}
          style={{ width: column.width }}
          sx={{
            backgroundColor: 'background.paper',
          }}
        >
          {column.label}
        </TableCell>
      ))}
    </TableRow>
  );
}

function rowContent(_index: number, row: Data) {
  return (
    <React.Fragment>
      {columns.map((column) => (
        <TableCell
          key={column.dataKey}
          align={column.numeric ? 'right' : 'left'}
        >
          {row[column.dataKey as keyof Data]}
        </TableCell>
      ))}
    </React.Fragment>
  );
}

export default function Payment() {
  interface Payment {
    id: number;
    amount: number;
    date: string;
  }

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const storedUser = localStorage.getItem('user');
  const userId = storedUser ? JSON.parse(storedUser) : null; // Define youtuberId with a default value or fetch it from props/state

  React.useEffect(() => {
    const getPayments = async () => {
      const paymentData = await fetchPaymentsForYoutuber(userId.toString());
      console.log(paymentData);
      if (paymentData) {
        setPayments(paymentData);
      }
      setLoading(false);
    };

    getPayments();
  }, [userId]);

  if (loading) {
    return <div>Loading payments...</div>;
  }

  return (
    <div>
      <h2>Payments for Youtuber {userId}</h2>
      <ul>
        {payments.map(payment => (
          <li key={payment.id}>
            Amount: {payment.amount}, Date: {payment.date}
          </li>
        ))}
      </ul>
    </div>
  );
};


