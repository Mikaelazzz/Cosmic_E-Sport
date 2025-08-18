"use client";
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Divider } from '@heroui/divider';

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <Button 
            color="danger" 
            variant="ghost"
            onPress={logout}
          >
            Logout
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* User Info Card */}
          <Card className="col-span-full">
            <CardHeader>
              <h3 className="text-xl font-semibold">Welcome, {user?.nama_lengkap}</h3>
            </CardHeader>
            <Divider />
            <CardBody>
              <div className="space-y-2">
                <p><strong>Role:</strong> {user?.role}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>NIM:</strong> {user?.nim}</p>
              </div>
            </CardBody>
          </Card>

          {/* Admin Features */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <h3 className="text-lg font-semibold">Pengurus Management</h3>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-gray-600 mb-4">
                Kelola pengurus dan jabatan
              </p>
              <Button 
                color="primary" 
                variant="flat"
                className="w-full"
                onPress={() => window.location.href = '/admin/pengurus'}
              >
                Manage Pengurus
              </Button>
            </CardBody>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <h3 className="text-lg font-semibold">Prestasi Management</h3>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-gray-600 mb-4">
                Kelola prestasi organisasi
              </p>
              <Button 
                color="secondary" 
                variant="flat"
                className="w-full"
                onPress={() => window.location.href = '/admin/prestasi'}
              >
                Manage Prestasi
              </Button>
            </CardBody>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <h3 className="text-lg font-semibold">Periode Management</h3>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-gray-600 mb-4">
                Kelola periode kepengurusan
              </p>
              <Button 
                color="success" 
                variant="flat"
                className="w-full"
                onPress={() => window.location.href = '/admin/periode'}
              >
                Manage Periode
              </Button>
            </CardBody>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Logged in as Administrator
          </p>
        </div>
      </div>
    </div>
  );
}