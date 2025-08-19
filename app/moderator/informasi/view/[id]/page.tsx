"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';

const ViewInformasiPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [informasi, setInformasi] = useState<any>(null);

  useEffect(() => {
    if (params.id) {
      fetchInformasi();
    }
  }, [params.id]);

  const fetchInformasi = async () => {
    try {
      const response = await fetch(`/api/moderator/informasi/${params.id}`);
      const result = await response.json();

      if (result.success) {
        setInformasi(result.data);
      } else {
        console.error('Failed to fetch informasi:', result.message);
        router.push('/moderator/informasi');
      }
    } catch (error) {
      console.error('Error fetching informasi:', error);
      router.push('/moderator/informasi');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'warning';
      case 'expired': return 'danger';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-400">Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!informasi) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Informasi tidak ditemukan</h1>
          <Button onPress={() => router.push('/moderator/informasi')}>
            Kembali ke Daftar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Detail Informasi</h1>
          <p className="text-gray-400 mt-2">Lihat detail informasi</p>
        </div>
        <div className="flex gap-3">
          <Button
            color="primary"
            onPress={() => router.push(`/moderator/informasi/edit/${params.id}`)}
          >
            Edit
          </Button>
          <Button
            variant="light"
            onPress={() => router.push('/moderator/informasi')}
          >
            Kembali
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-col items-start">
              <div className="flex items-center gap-3 mb-3">
                <Chip 
                  color={getStatusColor(informasi.status)}
                  variant="flat"
                >
                  {informasi.status}
                </Chip>
              </div>
              <h1 className="text-2xl font-bold">{informasi.nama_informasi}</h1>
            </CardHeader>
            <CardBody>
              {informasi.gambar && (
                <div className="mb-6">
                  <img 
                    src={informasi.gambar.startsWith('/src/informasi/') 
                      ? `/api/static/informasi/${informasi.gambar.replace('/src/informasi/', '')}`
                      : informasi.gambar
                    } 
                    alt={informasi.nama_informasi}
                    className="w-full max-h-96 object-cover rounded-lg"
                    style={{ aspectRatio: '16/9' }}
                  />
                </div>
              )}
              
              <div className="prose prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{informasi.deskripsi}</div>
              </div>

              {informasi.link && (
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <h4 className="font-semibold mb-2">Link:</h4>
                  <a 
                    href={informasi.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    {informasi.link}
                  </a>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Informasi</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Status:</label>
                <p className="text-white capitalize">{informasi.status}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Jadwal</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Tanggal Publish:</label>
                <p className="text-white">{formatDate(informasi.tanggal_publish)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-400">Tanggal Berakhir:</label>
                <p className="text-white">{formatDate(informasi.tanggal_berakhir)}</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Metadata</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Dibuat:</label>
                <p className="text-white">{formatDate(informasi.created_at)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-400">Diupdate:</label>
                <p className="text-white">{formatDate(informasi.updated_at)}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-400">Dibuat oleh:</label>
                <p className="text-white">{informasi.created_by_user?.nama_lengkap}</p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ViewInformasiPage;
