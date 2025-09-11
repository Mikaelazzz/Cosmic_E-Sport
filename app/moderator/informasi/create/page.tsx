"use client"
import React, { useState } from 'react';
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import ImageUpload from '@/components/ImageUpload';
import ModeratorLayout from '@/components/ModeratorLayout';

// Custom Textarea component since it's not available in HeroUI
const Textarea = ({ label, placeholder, value, onChange, maxRows, minRows, description, isRequired, ...props }: any) => (
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
    {description && <p className="text-xs text-gray-400">{description}</p>}
  </div>
);

const CreateInformasiPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tempId] = useState(() => `temp-${Date.now()}`); // Generate temporary ID
  const [formData, setFormData] = useState({
    nama_informasi: '',
    gambar: '',
    tanggal_publish: new Date().toISOString().split('T')[0],
    tanggal_berakhir: '',
    deskripsi: '',
    link: ''
  });

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
      const submitData = {
        ...formData,
        created_by: user.id
      };

      const response = await fetch('/api/moderator/informasi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      const result = await response.json();

      if (result.success) {
        // If we have a temporary image uploaded, rename it to use the real ID
        if (formData.gambar && formData.gambar.includes(tempId)) {
          try {
            const renameResponse = await fetch('/api/upload/informasi/rename', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                oldId: tempId,
                newId: result.data.id
              })
            });
            
            if (renameResponse.ok) {
              const renameResult = await renameResponse.json();
              if (renameResult.success) {
                // Update the informasi record with the new image path
                await fetch(`/api/moderator/informasi/${result.data.id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    ...submitData,
                    gambar: renameResult.data.newPath
                  })
                });
              }
            }
          } catch (error) {
            console.warn('Failed to rename uploaded image:', error);
          }
        }
        
        router.push('/moderator/informasi');
      } else {
        console.error('Failed to create informasi:', result.message);
      }
    } catch (error) {
      console.error('Error creating informasi:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModeratorLayout
      title="Tambah Informasi Baru"
      description="Buat informasi atau pengumuman baru untuk anggota"
    >
      <div className="flex justify-between items-center mb-6">
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
                    informasiId={tempId}
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
                {loading ? 'Menyimpan...' : 'Simpan Informasi'}
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
    </ModeratorLayout>
  );
};

export default CreateInformasiPage;
