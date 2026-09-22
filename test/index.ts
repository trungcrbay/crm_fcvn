import axios from 'axios';
const ENDPOINT1 = `http://localhost:8000/v1/customer-requests/12/approve`;
const ENDPOINT2 = `http://localhost:8000/v1/customer-requests/12/approve`;

// MOCK accesstoken thủ công để test --> Không ảnh hưởng đến hệ thống hiện tại
const accessTokenUser1 = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInJvbGVJZCI6OSwicm9sZU5hbWUiOiJNQVNURVIiLCJkZXBhcnRtZW50SWQiOm51bGwsInV1aWQiOiJmYTM4YTNhMC1hYjQ5LTQ0YzAtOWI2NS03MTQ3MjZiZjE3ZjIiLCJpYXQiOjE3OTAwNDM2NzMsImV4cCI6MTc5MTMzOTY3M30.4E2New0jew-Asj789rLWidOlFzVB3oodPcFdoHk_q2U`;
const accessTokenUser2 = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsInJvbGVJZCI6OSwicm9sZU5hbWUiOiJNQVNURVIiLCJkZXBhcnRtZW50SWQiOm51bGwsInV1aWQiOiI2OTVmZGRjZS00NDBkLTRiMzktYjVjNi0wMThhNDQ4ZGY3NWIiLCJpYXQiOjE3OTAwNDM2ODYsImV4cCI6MTc5MTMzOTY4Nn0.wHPbPmmR3yaHFbgb-dDJJMeLcw7XQtLYSfWD-xf0zAY`;

const baseHeaders = {
  'Content-Type': 'application/json',
};

const headers1 = {
  ...baseHeaders,
  Authorization: `Bearer ${accessTokenUser1}`,
};

const headers2 = {
  ...baseHeaders,
  Authorization: `Bearer ${accessTokenUser2}`,
};

const body = {};

const admin1$ = axios
  .post(ENDPOINT1, body, { headers: headers1 })
  .catch((e) => {
    console.log('Error in admin1:', e);
  });
const admin2$ = axios
  .post(ENDPOINT2, body, { headers: headers2 })
  .catch((e) => {
    console.log('Error in admin2:', e);
  });

Promise.all([admin1$, admin2$]).then(([res1, res2]) => {
  console.log('admin 1 response:', res1);
  console.log('admin 2 response:', res2);
});
