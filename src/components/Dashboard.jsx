import React, { useState, useEffect } from 'react';
import { Container, Paper, Typography, Box, Button, Grid, Card, CardContent, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [packages, setPackages] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPackages();
    fetchAppointments();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/packages', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPackages(data);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/appointments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleAddAppointment = async () => {
    if (!selectedPackage || !customerName) {
      alert('Please select a package and enter customer name');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          customerName,
          packageName: selectedPackage.name,
          price: selectedPackage.price,
        }),
      });

      if (response.ok) {
        alert('Appointment added successfully');
        setCustomerName('');
        setSelectedPackage(null);
        fetchAppointments();
      }
    } catch (error) {
      console.error('Error adding appointment:', error);
      alert('Error adding appointment');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4">Spa Management Dashboard</Typography>
        <Button variant="contained" color="secondary" onClick={handleLogout}>
          Logout
        </Button>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Add New Appointment</Typography>
            <TextField
              fullWidth
              label="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              margin="normal"
            />
            <Grid container spacing={2} sx={{ mt: 2 }}>
              {packages.map((pkg) => (
                <Grid item xs={6} key={pkg.id}>
                  <Button
                    fullWidth
                    variant={selectedPackage?.id === pkg.id ? "contained" : "outlined"}
                    onClick={() => setSelectedPackage(pkg)}
                  >
                    {pkg.name} - ₹{pkg.price}
                  </Button>
                </Grid>
              ))}
            </Grid>
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
              onClick={handleAddAppointment}
            >
              Add Appointment
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Recent Appointments</Typography>
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              {appointments.map((appointment) => (
                <Card key={appointment.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6">{appointment.customerName}</Typography>
                    <Typography color="textSecondary">
                      Package: {appointment.packageName}
                    </Typography>
                    <Typography color="textSecondary">
                      Price: ₹{appointment.price}
                    </Typography>
                    <Typography color="textSecondary">
                      Date: {new Date(appointment.date).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard;