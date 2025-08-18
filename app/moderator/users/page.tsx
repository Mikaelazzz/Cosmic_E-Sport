"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/dropdown';
import { Chip } from '@heroui/chip';
import { User } from '@heroui/user';
import { Pagination } from '@heroui/pagination';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Spinner } from '@heroui/spinner';
import { Selection, SortDescriptor } from '@heroui/table';
import { IconSearch, IconPlus } from '@/components/icons';
import { useAuth } from '@/context/AuthContext';
import { getUserAvatarUrl, generateInitials } from '@/lib/avatar';

// Custom icons
const IconChevronDown = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 10.293l3.146-3.147a.5.5 0 01.708.708L8 11.707 4.146 7.854a.5.5 0 01.708-.708L8 10.293z"/>
  </svg>
);

const IconDotsVertical = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M9.5 13a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0-5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0-5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
  </svg>
);

// Types
interface UserData {
  id: string;
  nama_lengkap: string;
  email: string;
  nim?: string;
  role: 'anggota' | 'pengurus' | 'moderator' | 'admin';
  jabatan?: string;
  profile_image?: string;
  created_at: string;
}

interface FormData {
  name: string;
  email: string;
  nim: string;
  password: string;
}

// Constants
const columns = [
  {name: "ID", uid: "id", sortable: true},
  {name: "NAMA", uid: "name", sortable: true},
  {name: "EMAIL", uid: "email", sortable: true},
  {name: "NIM", uid: "nim", sortable: true},
  {name: "ROLE", uid: "role", sortable: true},
  {name: "JABATAN", uid: "jabatan", sortable: true},
  {name: "ACTIONS", uid: "actions"},
];

const roleOptions = [
  {name: "Anggota", uid: "anggota"},
  {name: "Pengurus", uid: "pengurus"},
  {name: "Moderator", uid: "moderator"},
];

const INITIAL_VISIBLE_COLUMNS = ["name", "email", "nim", "role", "jabatan", "actions"];

const roleColorMap = {
  anggota: "default" as const,
  pengurus: "primary" as const,
  moderator: "secondary" as const,
  admin: "danger" as const,
};

export default function UsersPage() {
  // Auth context
  const { user } = useAuth();
  
  // Ref to prevent multiple fetch calls
  const hasFetched = useRef(false);
  
  // State
  const [users, setUsers] = useState<UserData[]>([]);
  const [filterValue, setFilterValue] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState<Selection>(new Set(INITIAL_VISIBLE_COLUMNS));
  const [roleFilter, setRoleFilter] = useState<Selection>("all");
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "name",
    direction: "ascending",
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    nim: '',
    password: '',
  });

  const { isOpen, onOpen, onClose } = useDisclosure();

  // Memoized fetch function
  const fetchUsers = useCallback(async () => {
    if (hasFetched.current) return; // Prevent multiple calls
    hasFetched.current = true;
    
    try {
      const response = await fetch('/api/moderator/users');
      if (response.ok) {
        const result = await response.json();
        // API returns {success: true, data: [...]}
        if (result.success && Array.isArray(result.data)) {
          setUsers(result.data);
        } else {
          console.error('Invalid API response format:', result);
          setUsers([]);
        }
      } else {
        console.error('Failed to fetch users:', response.status);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Set current user once (no useEffect needed)
  React.useLayoutEffect(() => {
    if (user && !currentUser) {
      // Convert User to UserData type with proper role mapping
      const userData: UserData = {
        id: user.id,
        nama_lengkap: user.nama_lengkap,
        email: user.email,
        nim: user.nim || 'N/A',
        role: user.role === 'user' ? 'anggota' : user.role as 'anggota' | 'pengurus' | 'moderator' | 'admin',
        jabatan: user.jabatan || user.role,
        created_at: user.created_at || new Date().toISOString()
      };
      setCurrentUser(userData);
    } else if (!user && !currentUser) {
      // Set demo user if no user in context
      setCurrentUser({
        id: 'demo-moderator',
        nama_lengkap: 'Demo Moderator',
        email: 'moderator@cosmic.com',
        nim: 'MOD001',
        role: 'moderator',
        jabatan: 'moderator',
        created_at: new Date().toISOString()
      });
    }
  }, []);

  // Fetch users only once when component mounts
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Permission check
  const canEditUser = (targetUser: UserData) => {
    if (!currentUser) return false;
    
    // Ketua dan Wakil Ketua dapat edit semua user
    if (currentUser.jabatan === 'ketua' || currentUser.jabatan === 'wakil_ketua') {
      return true;
    }
    
    // User lain hanya bisa edit anggota, tidak bisa edit pengurus
    if (targetUser.role === 'pengurus') {
      return false;
    }
    
    return true;
  };

  const canDeleteUser = (targetUser: UserData) => {
    if (!currentUser) return false;
    
    // Ketua dan Wakil Ketua dapat delete user (kecuali sesama ketua/wakil)
    if (currentUser.jabatan === 'ketua' || currentUser.jabatan === 'wakil_ketua') {
      return !(targetUser.jabatan === 'ketua' || targetUser.jabatan === 'wakil_ketua');
    }
    
    // User lain hanya bisa delete anggota
    if (targetUser.role === 'pengurus') {
      return false;
    }
    
    return true;
  };

  // Pagination
  const pages = Math.ceil(users.length / rowsPerPage);
  const hasSearchFilter = Boolean(filterValue);

  // Memoized values
  const headerColumns = useMemo(() => {
    if (visibleColumns === "all") return columns;
    return columns.filter((column) => Array.from(visibleColumns).includes(column.uid));
  }, [visibleColumns]);

  const filteredItems = useMemo(() => {
    let filteredUsers = [...users];

    if (hasSearchFilter) {
      filteredUsers = filteredUsers.filter((user) =>
        user.nama_lengkap.toLowerCase().includes(filterValue.toLowerCase()) ||
        user.email.toLowerCase().includes(filterValue.toLowerCase()) ||
        (user.nim && user.nim.toLowerCase().includes(filterValue.toLowerCase()))
      );
    }

    if (roleFilter !== "all" && Array.from(roleFilter).length !== roleOptions.length) {
      filteredUsers = filteredUsers.filter((user) =>
        Array.from(roleFilter).includes(user.role),
      );
    }

    return filteredUsers;
  }, [users, filterValue, roleFilter]);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a: UserData, b: UserData) => {
      const first = a[sortDescriptor.column as keyof UserData] as string;
      const second = b[sortDescriptor.column as keyof UserData] as string;
      const cmp = first < second ? -1 : first > second ? 1 : 0;
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  // Event handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingUser ? `/api/moderator/users/${editingUser.id}` : '/api/moderator/users';
      const method = editingUser ? 'PATCH' : 'POST';

      // For moderator, can only create/edit anggota
      const userData = {
        name: formData.name,
        email: formData.email,
        nim: formData.nim,
        role: 'anggota', // Force role to anggota
        ...(formData.password && { password: formData.password }), // Only include password if provided
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        await fetchUsers();
        onClose();
        resetForm();
      } else {
        console.error('Failed to save user');
      }
    } catch (error) {
      console.error('Error saving user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEdit = (user: UserData) => {
    setEditingUser(user);
    setFormData({
      name: user.nama_lengkap,
      email: user.email,
      nim: user.nim || '',
      password: '', // Don't prefill password for security
    });
    onOpen();
  };

  const handleDelete = async (userId: string) => {
    try {
      const response = await fetch(`/api/moderator/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchUsers();
      } else {
        console.error('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      nim: '',
      password: '',
    });
    setEditingUser(null);
  };

  const onRowsPerPageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const onSearchChange = useCallback((value?: string) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue("");
    }
  }, []);

  const onClear = useCallback(() => {
    setFilterValue("")
    setPage(1)
  }, [])

  // Render cell
  const renderCell = useCallback((user: UserData, columnKey: React.Key) => {
    switch (columnKey) {
      case "name":
        return (
          <User
            avatarProps={{
              radius: "full", 
              size: "sm",
              src: getUserAvatarUrl(user, 32),
              name: generateInitials(user.nama_lengkap),
              isBordered: true
            }}
            classNames={{
              description: "text-default-500",
            }}
            description={user.email}
            name={user.nama_lengkap}
          >
            {user.email}
          </User>
        );
      case "email":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{user.email}</p>
          </div>
        );
      case "nim":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{user.nim || '-'}</p>
          </div>
        );
      case "role":
        return (
          <Chip
            className="capitalize border-none gap-1 text-default-600"
            color={roleColorMap[user.role]}
            size="sm"
            variant="dot"
          >
            {user.role}
          </Chip>
        );
      case "jabatan":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">
              {user.jabatan ? user.jabatan.replace('_', ' ') : '-'}
            </p>
          </div>
        );
      case "actions":
        return (
          <div className="relative flex justify-end items-center gap-2">
            <Dropdown className="bg-background border-1 border-default-200">
              <DropdownTrigger>
                <Button isIconOnly radius="full" size="sm" variant="light">
                  <IconDotsVertical className="text-default-400" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem
                  key="edit"
                  onPress={() => handleEdit(user)}
                  isDisabled={!canEditUser(user)}
                >
                  Edit
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  className="text-danger"
                  color="danger"
                  onPress={() => handleDelete(user.id)}
                  isDisabled={!canDeleteUser(user)}
                >
                  Delete
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        );
      default:
        return null;
    }
  }, [currentUser]);

  // Top content
  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            classNames={{
              base: "w-full sm:max-w-[44%]",
              inputWrapper: "border-1",
            }}
            placeholder="Cari berdasarkan nama, email, atau NIM..."
            size="sm"
            startContent={<IconSearch className="text-default-300" />}
            value={filterValue}
            variant="bordered"
            onClear={() => setFilterValue("")}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={<IconChevronDown className="text-small" />}
                  size="sm"
                  variant="flat"
                >
                  Role
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Role Filter"
                closeOnSelect={false}
                selectedKeys={roleFilter}
                selectionMode="multiple"
                onSelectionChange={setRoleFilter}
              >
                {roleOptions.map((role) => (
                  <DropdownItem key={role.uid} className="capitalize">
                    {role.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={<IconChevronDown className="text-small" />}
                  size="sm"
                  variant="flat"
                >
                  Columns
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={visibleColumns}
                selectionMode="multiple"
                onSelectionChange={setVisibleColumns}
              >
                {columns.map((column) => (
                  <DropdownItem key={column.uid} className="capitalize">
                    {column.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            
            <Button
              color="primary"
              endContent={<IconPlus />}
              size="sm"
              onPress={() => {
                resetForm();
                onOpen();
              }}
            >
              Add New
            </Button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">Total {users.length} users</span>
          <label className="flex items-center text-default-400 text-small">
            Rows per page:
            <select
              className="bg-transparent outline-none text-default-400 text-small"
              onChange={onRowsPerPageChange}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </label>
        </div>
      </div>
    );
  }, [
    filterValue,
    roleFilter,
    visibleColumns,
    onSearchChange,
    onRowsPerPageChange,
    users.length,
  ]);

  // Bottom content
  const bottomContent = useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <Pagination
          showControls
          classNames={{
            cursor: "bg-foreground text-background",
          }}
          color="default"
          isDisabled={hasSearchFilter}
          page={page}
          total={pages}
          variant="light"
          onChange={setPage}
        />
        <span className="text-small text-default-400">
          {selectedKeys === "all"
            ? "All items selected"
            : `${selectedKeys.size} of ${items.length} selected`}
        </span>
      </div>
    );
  }, [selectedKeys, items.length, page, pages, hasSearchFilter]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Manajemen User</h1>
          <p className="text-gray-600 mt-2">Kelola data anggota UKM</p>
        </div>

        <Table
          isCompact
          removeWrapper
          aria-label="Users table"
          bottomContent={bottomContent}
          bottomContentPlacement="outside"
          classNames={{
            wrapper: "max-h-[382px]",
          }}
          selectedKeys={selectedKeys}
          selectionMode="multiple"
          sortDescriptor={sortDescriptor}
          topContent={topContent}
          topContentPlacement="outside"
          onSelectionChange={setSelectedKeys}
          onSortChange={setSortDescriptor}
        >
          <TableHeader columns={headerColumns}>
            {(column) => (
              <TableColumn
                key={column.uid}
                align={column.uid === "actions" ? "center" : "start"}
                allowsSorting={column.sortable}
              >
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody emptyContent={"No users found"} items={sortedItems}>
            {(item) => (
              <TableRow key={item.id}>
                {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Modal for Create/Edit User */}
        <Modal
          isOpen={isOpen}
          onClose={() => {
            onClose();
            resetForm();
          }}
          placement="top-center"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  {editingUser ? 'Edit User' : 'Tambah User Baru'}
                </ModalHeader>
                <ModalBody>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <Input
                        name="name"
                        label="Nama Lengkap"
                        placeholder="Masukkan nama lengkap"
                        value={formData.name}
                        onChange={handleInputChange}
                        isRequired
                        variant="bordered"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <Input
                        name="email"
                        type="email"
                        label="Email"
                        placeholder="Masukkan email"
                        value={formData.email}
                        onChange={handleInputChange}
                        isRequired
                        variant="bordered"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <Input
                        name="nim"
                        label="NIM"
                        placeholder="Masukkan NIM"
                        value={formData.nim}
                        onChange={handleInputChange}
                        isRequired
                        variant="bordered"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <Input
                        name="password"
                        type="password"
                        label="Password"
                        placeholder={editingUser ? "Kosongkan jika tidak ingin mengubah password" : "Masukkan password"}
                        value={formData.password}
                        onChange={handleInputChange}
                        isRequired={!editingUser}
                        variant="bordered"
                      />
                    </div>
                    
                    <div className="bg-default-100 p-3 rounded-lg">
                      <p className="text-small text-default-600">
                        <strong>Info:</strong> User yang dibuat akan memiliki role "anggota" secara otomatis. Data akan ditampilkan untuk semua pengguna yang telah mendaftar kecuali admin.
                      </p>
                    </div>
                  </form>
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="flat" onPress={onClose}>
                    Cancel
                  </Button>
                  <Button 
                    color="primary" 
                    onPress={() => handleSubmit({} as React.FormEvent)}
                    isLoading={isSubmitting}
                  >
                    {editingUser ? 'Update' : 'Create'}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}
