"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';

// Custom Textarea component
const Textarea = ({ label, placeholder, value, onChange, maxRows, minRows, isRequired, ...props }: any) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-medium">{label} {isRequired && <span className="text-red-500">*</span>}</label>
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      rows={minRows || maxRows || 4}
      className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-gray-800 text-white focus:border-blue-500 focus:outline-none resize-vertical"
      {...props}
    />
  </div>
);

const EditInformasiPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState({
    nama_informasi: '',
    gambar: '',
    tanggal_publish: '',
    tanggal_berakhir: '',
    deskripsi: '',
    link: ''
  });

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
        const data = result.data;
        setFormData({
          nama_informasi: data.nama_informasi || '',
          gambar: data.gambar || '',
          tanggal_publish: data.tanggal_publish ? new Date(data.tanggal_publish).toISOString().split('T')[0] : '',
          tanggal_berakhir: data.tanggal_berakhir ? new Date(data.tanggal_berakhir).toISOString().split('T')[0] : '',
          deskripsi: data.deskripsi || '',
          link: data.link || ''
        });
      } else {
        console.error('Failed to fetch informasi:', result.message);
        router.push('/moderator/informasi');
      }
    } catch (error) {
      console.error('Error fetching informasi:', error);
      router.push('/moderator/informasi');
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/moderator/informasi/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        router.push('/moderator/informasi');
      } else {
        console.error('Failed to update informasi:', result.message);
      }
    } catch (error) {
      console.error('Error updating informasi:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
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

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Edit Informasi</h1>
          <p className="text-gray-400 mt-2">Ubah informasi</p>
        </div>
        <Button
          variant="light"
          onPress={() => router.push('/moderator/informasi')}
        >
          Kembali
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Informasi Utama</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  label="Nama Informasi"
                  placeholder="Masukkan nama informasi"
                  value={formData.nama_informasi}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('nama_informasi', e.target.value)}
                  isRequired
                />
                
                <Textarea
                  label="Deskripsi"
                  placeholder="Deskripsi informasi"
                  value={formData.deskripsi}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('deskripsi', e.target.value)}
                  minRows={6}
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium">Gambar</label>
                  <ImageUpload
                    value={formData.gambar}
                    onChange={(value) => handleInputChange('gambar', value || '')}
                    informasiId={params.id as string}
                  />
                </div>

                <Input
                  label="Link"
                  placeholder="https://example.com"
                  value={formData.link}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('link', e.target.value)}
                />
              </CardBody>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Pengaturan Publikasi</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Status Otomatis:</strong> Status akan ditentukan otomatis berdasarkan tanggal publish dan berakhir:
                  </p>
                  <ul className="text-xs text-blue-700 mt-2 space-y-1">
                    <li>• <span className="font-medium">Terjadwal:</span> Belum mencapai tanggal publish</li>
                    <li>• <span className="font-medium">Aktif:</span> Dalam periode publish hingga berakhir</li>
                    <li>• <span className="font-medium">Kedaluwarsa:</span> Melewati tanggal berakhir</li>
                  </ul>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Jadwal</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  label="Tanggal Publish"
                  type="date"
                  value={formData.tanggal_publish}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('tanggal_publish', e.target.value)}
                  isRequired
                />

                <Input
                  label="Tanggal Berakhir"
                  type="date"
                  value={formData.tanggal_berakhir}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('tanggal_berakhir', e.target.value)}
                  isRequired
                />
              </CardBody>
            </Card>

            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                color="primary"
                isLoading={loading}
                className="w-full"
              >
                {loading ? 'Menyimpan...' : 'Update Informasi'}
              </Button>
              
              <Button
                variant="light"
                onPress={() => router.push('/moderator/informasi')}
                className="w-full"
              >
                Batal
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditInformasiPage;
