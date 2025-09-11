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
import { getUserAvatarUrl } from '@/lib/avatar';
import ModeratorLayout from '@/components/ModeratorLayout';

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
  role: 'user' | 'moderator' | 'admin';
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

interface PasswordValidation {
  length: boolean;
  uppercase: boolean;
  number: boolean;
  symbol: boolean;
  isValid: boolean;
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
  {name: "User", uid: "user"},
  {name: "Moderator", uid: "moderator"},
  {name: "Admin", uid: "admin"},
];

const INITIAL_VISIBLE_COLUMNS = ["name", "email", "nim", "role", "jabatan", "actions"];

const roleColorMap = {
  user: "default" as const,
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
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    length: false,
    uppercase: false,
    number: false,
    symbol: false,
    isValid: false
  });
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();

  // Fetch function
  const fetchUsers = useCallback(async (force = false) => {
    if (!force && hasFetched.current) return; // Prevent multiple calls unless forced
    if (!hasFetched.current) hasFetched.current = true;
    
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

  // Set current user (Update whenever user changes)
  React.useEffect(() => {
    if (user) {
      // Convert User to UserData type with proper role mapping
      const userData: UserData = {
        id: user.id,
        nama_lengkap: user.nama_lengkap,
        email: user.email,
        nim: user.nim || 'N/A',
        role: user.role as 'user' | 'moderator' | 'admin',
        jabatan: user.jabatan || user.role,
        created_at: user.created_at || new Date().toISOString()
      };
      
      // Enhanced debug logging untuk melihat semua detail user
      console.log('=== USER DATA DEBUG ===');
      console.log('AuthContext user:', user);
      console.log('Processed userData:', userData);
      console.log('Jabatan check:', {
        originalJabatan: user.jabatan,
        processedJabatan: userData.jabatan,
        isKetuaOrWakil: isKetuaOrWakilKetua(userData.jabatan),
        canCreate: userData.role === 'admin' || (userData.role === 'moderator' && isKetuaOrWakilKetua(userData.jabatan))
      });
      console.log('========================');
      
      setCurrentUser(userData);
    } else {
      setCurrentUser(null);
    }
  }, [user]); // Depend on user changes

  // Fetch users only once when component mounts
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Helper function to check if jabatan is ketua or wakil ketua
  const isKetuaOrWakilKetua = (jabatan: string | undefined) => {
    console.log('=== isKetuaOrWakilKetua CALLED ===');
    console.log('Input jabatan:', jabatan);
    
    if (!jabatan) {
      console.log('No jabatan provided, returning false');
      return false;
    }
    
    const normalizedJabatan = jabatan.toLowerCase().trim();
    console.log('Normalized jabatan:', normalizedJabatan);
    
    // Check for various formats of ketua and wakil ketua
    const isKetua = normalizedJabatan.includes('ketua') && !normalizedJabatan.includes('wakil');
    const isWakilKetua = normalizedJabatan.includes('wakil') && normalizedJabatan.includes('ketua');
    const isChairman = normalizedJabatan.includes('chairman') && !normalizedJabatan.includes('vice');
    const isViceChairman = normalizedJabatan.includes('vice') && normalizedJabatan.includes('chairman');
    
    const result = isKetua || isWakilKetua || isChairman || isViceChairman;
    
    console.log('Jabatan analysis:', {
      originalJabatan: jabatan,
      normalizedJabatan,
      isKetua,
      isWakilKetua,
      isChairman,
      isViceChairman,
      finalResult: result
    });
    console.log('====================================');
    
    return result;
  };

  // Permission check
  const canEditUser = (targetUser: UserData) => {
    if (!currentUser) return false;
    
    // Debug log for troubleshooting
    console.log('canEditUser check:', {
      currentUserRole: currentUser.role,
      currentUserJabatan: currentUser.jabatan,
      targetUserRole: targetUser.role,
      targetUserJabatan: targetUser.jabatan,
      isCurrentUserKetuaOrWakil: isKetuaOrWakilKetua(currentUser.jabatan),
      isTargetUserKetuaOrWakil: isKetuaOrWakilKetua(targetUser.jabatan)
    });
    
    // Admin always has full access except to other admins
    if (currentUser.role === 'admin') {
      return targetUser.role !== 'admin' || targetUser.id === currentUser.id;
    }
    
    // Moderator with ketua or wakil_ketua position has extensive access
    if (currentUser.role === 'moderator' && isKetuaOrWakilKetua(currentUser.jabatan)) {
      // Cannot edit admin users
      if (targetUser.role === 'admin') return false;
      
      // Can edit other ketua/wakil_ketua only if it's themselves
      if (isKetuaOrWakilKetua(targetUser.jabatan)) {
        return targetUser.id === currentUser.id;
      }
      
      // Can edit all other users (regular moderators and users)
      return true;
    }
    
    // Regular moderator without ketua/wakil_ketua position has no edit access
    return false;
  };

  const canDeleteUser = (targetUser: UserData) => {
    if (!currentUser) return false;
    
    // Cannot delete yourself
    if (targetUser.id === currentUser.id) {
      return false;
    }
    
    console.log('canDeleteUser check:', {
      currentUserRole: currentUser.role,
      currentUserJabatan: currentUser.jabatan,
      targetUserRole: targetUser.role,
      targetUserJabatan: targetUser.jabatan,
      isCurrentUserKetuaOrWakil: isKetuaOrWakilKetua(currentUser.jabatan)
    });
    
    // Admin can delete everyone except other admins
    if (currentUser.role === 'admin') {
      return targetUser.role !== 'admin';
    }
    
    // Moderator with ketua or wakil_ketua position can delete users
    if (currentUser.role === 'moderator' && isKetuaOrWakilKetua(currentUser.jabatan)) {
      // Cannot delete admin users
      if (targetUser.role === 'admin') return false;
      
      // Cannot delete other ketua/wakil_ketua
      if (isKetuaOrWakilKetua(targetUser.jabatan)) return false;
      
      // Can delete regular moderators and users
      return true;
    }
    
    // Regular moderator without ketua/wakil_ketua position cannot delete users
    return false;
  };

  const canCreateUser = () => {
    console.log('=== canCreateUser CALLED ===');
    console.log('currentUser:', currentUser);
    
    if (!currentUser) {
      console.log('No currentUser, returning false');
      return false;
    }
    
    const isKetuaWakil = isKetuaOrWakilKetua(currentUser.jabatan);
    const isAdmin = currentUser.role === 'admin';
    const isModerator = currentUser.role === 'moderator';
    const canCreate = isAdmin || (isModerator && isKetuaWakil);
    
    console.log('canCreateUser detailed check:', {
      currentUserRole: currentUser.role,
      currentUserJabatan: currentUser.jabatan,
      isAdmin,
      isModerator,
      isKetuaWakil,
      finalResult: canCreate
    });
    console.log('=============================');
    
    return canCreate;
  };

  const canUpdatePassword = () => {
    if (!currentUser) return false;
    
    console.log('canUpdatePassword check:', {
      currentUserRole: currentUser.role,
      currentUserJabatan: currentUser.jabatan,
      isKetuaOrWakil: isKetuaOrWakilKetua(currentUser.jabatan)
    });
    
    // Admin always can update passwords
    if (currentUser.role === 'admin') return true;
    
    // Moderator with ketua or wakil_ketua position can update passwords
    if (currentUser.role === 'moderator' && isKetuaOrWakilKetua(currentUser.jabatan)) {
      return true;
    }
    
    // Regular moderator without ketua/wakil_ketua position cannot update passwords
    return false;
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

  // Password validation function
  const validatePassword = (password: string) => {
    const validation = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      isValid: false
    };
    
    validation.isValid = validation.length && validation.uppercase && validation.number && validation.symbol;
    setPasswordValidation(validation);
    return validation.isValid;
  };

  // Submit handler untuk form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleUserSubmit();
  };

  // Submit handler untuk button click
  const handleUserSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Validate password if provided
      if (formData.password && !validatePassword(formData.password)) {
        alert('Password harus memiliki minimal 8 karakter, 1 huruf kapital, 1 angka, dan 1 simbol');
        setIsSubmitting(false);
        return;
      }

      const url = editingUser ? `/api/moderator/users/${editingUser.id}` : '/api/moderator/users';
      const method = editingUser ? 'PATCH' : 'POST';

      // For moderator, can only create/edit user
      const userData = {
        name: formData.name,
        email: formData.email,
        nim: formData.nim,
        role: 'user', // Force role to user (sesuai database schema)
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
        await fetchUsers(true); // Force refresh
        onClose();
        resetForm();
      } else {
        const result = await response.json();
        alert(result.message || 'Failed to save user');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error saving user');
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

    // Validate password in real-time
    if (name === 'password') {
      setTimeout(() => validatePassword(value), 500); // Debounce 500ms
    }
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

  const handleDeleteConfirm = (userId: string) => {
    setDeleteUserId(userId);
    onDeleteOpen();
  };

  const handleDelete = async () => {
    if (!deleteUserId) return;

    try {
      const response = await fetch(`/api/moderator/users/${deleteUserId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchUsers(true); // Force refresh
        onDeleteClose();
        setDeleteUserId(null);
      } else {
        const result = await response.json();
        alert(result.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
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
    setShowPassword(false);
    setPasswordValidation({
      length: false,
      uppercase: false,
      number: false,
      symbol: false,
      isValid: false
    });
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

  // Eye icon component for password visibility toggle
  const EyeIcon = () => (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="text-gray-400 hover:text-gray-200 transition-colors p-1"
      tabIndex={-1}
    >
      {showPassword ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );

  // Render cell
  const renderCell = useCallback((user: UserData, columnKey: React.Key) => {
    switch (columnKey) {
      case "name":
        return (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 border-2 border-yellow-400 rounded-full overflow-hidden flex items-center justify-center">
                  <img 
                    // key={avatarKey} 
                    src={getUserAvatarUrl(user, 200, true)}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/logc.png';
                    }}
                  />
                </div>
            <div className="flex flex-col">
              <p className="text-sm font-medium">{user.nama_lengkap}</p>
              {/* <p className="text-xs text-default-500">{user.email}</p> */}
            </div>
          </div>
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
            {user.role === 'user' ? 'User' : user.role === 'moderator' ? 'Moderator' : 'Admin'}
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
                  onPress={() => handleDeleteConfirm(user.id)}
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
            
            {(() => {
              if (!currentUser) return false;
              
              // Explicit condition for troubleshooting
              const isAdmin = currentUser.role === 'admin';
              const isModerator = currentUser.role === 'moderator';
              const jabatan = currentUser.jabatan?.toLowerCase().trim() || '';
              const isKetua = jabatan.includes('ketua') && !jabatan.includes('wakil');
              const isWakilKetua = jabatan.includes('wakil') && jabatan.includes('ketua');
              const isLeadership = isKetua || isWakilKetua;
              
              const shouldShowButton = isAdmin || (isModerator && isLeadership);
              
              console.log('=== ADD NEW BUTTON RENDER ===');
              console.log('currentUser.role:', currentUser.role);
              console.log('currentUser.jabatan:', currentUser.jabatan);
              console.log('Processed jabatan:', jabatan);
              console.log('isAdmin:', isAdmin);
              console.log('isModerator:', isModerator);
              console.log('isKetua:', isKetua);
              console.log('isWakilKetua:', isWakilKetua);
              console.log('isLeadership:', isLeadership);
              console.log('shouldShowButton:', shouldShowButton);
              console.log('==============================');
              
              return shouldShowButton;
            })() && (
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
            )}
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
    currentUser, // Add currentUser as dependency
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

  // Check if user has any access to the page
  const hasPageAccess = () => {
    if (!currentUser) return false;
    
    console.log('hasPageAccess check:', {
      currentUserRole: currentUser.role,
      currentUserJabatan: currentUser.jabatan,
      isKetuaOrWakil: isKetuaOrWakilKetua(currentUser.jabatan),
      result: currentUser.role === 'admin' || (currentUser.role === 'moderator' && isKetuaOrWakilKetua(currentUser.jabatan))
    });
    
    // Admin always has access
    if (currentUser.role === 'admin') return true;
    
    // Moderator with ketua or wakil_ketua position has access
    if (currentUser.role === 'moderator' && isKetuaOrWakilKetua(currentUser.jabatan)) {
      return true;
    }
    
    // Regular moderator without ketua/wakil_ketua position has no access
    return false;
  };

  // Show access denied message for users without permission  
  if (!loading && currentUser && !hasPageAccess()) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                Akses Ditolak
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Anda tidak memiliki akses untuk mengelola user.
              </p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <div className="flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Akses Terbatas
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                Hanya <strong>Admin</strong> dan <strong>Moderator dengan jabatan Ketua atau Wakil Ketua</strong> yang dapat mengakses halaman manajemen user.
              </p>
              <div className="mt-4">
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  Role Anda: <strong>{currentUser.role}</strong> | 
                  Jabatan: <strong>{currentUser.jabatan || 'Tidak ada'}</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ModeratorLayout
      title="User Management"
      description="Kelola pengguna dan anggota komunitas"
    >
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
                  <form id="user-form" onSubmit={handleFormSubmit} className="space-y-4">
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
                    {canUpdatePassword() && (
                      <div className="grid grid-cols-1 gap-4">
                        <Input
                          name="password"
                          type={showPassword ? "text" : "password"}
                          label="Password"
                          placeholder={editingUser ? "Kosongkan jika tidak ingin mengubah password" : "Masukkan password"}
                          value={formData.password}
                          onChange={handleInputChange}
                          isRequired={!editingUser}
                          variant="bordered"
                          endContent={<EyeIcon />}
                        />
                        
                        {/* Password validation indicators */}
                        {formData.password && (
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Syarat password:</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center space-x-2">
                                <span className={passwordValidation.length ? 'text-green-500' : 'text-red-500'}>
                                  {passwordValidation.length ? '✓' : '✗'}
                                </span>
                                <span>Minimal 8 karakter</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={passwordValidation.uppercase ? 'text-green-500' : 'text-red-500'}>
                                  {passwordValidation.uppercase ? '✓' : '✗'}
                                </span>
                                <span>1 huruf kapital</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={passwordValidation.number ? 'text-green-500' : 'text-red-500'}>
                                  {passwordValidation.number ? '✓' : '✗'}
                                </span>
                                <span>1 angka</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={passwordValidation.symbol ? 'text-green-500' : 'text-red-500'}>
                                  {passwordValidation.symbol ? '✓' : '✗'}
                                </span>
                                <span>1 simbol</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="bg-default-100 p-3 rounded-lg">
                      <p className="text-small text-default-600">
                        <strong>Info:</strong> {(() => {
                          if (currentUser?.role === 'admin') {
                            return "User yang dibuat akan memiliki role \"user\" secara otomatis. Anda memiliki akses penuh sebagai admin.";
                          } else if (currentUser?.role === 'moderator' && isKetuaOrWakilKetua(currentUser?.jabatan)) {
                            return "User yang dibuat akan memiliki role \"user\" secara otomatis. Anda memiliki akses penuh sebagai " + 
                                   (currentUser.jabatan || 'Moderator') + ".";
                          } else {
                            return "Anda tidak memiliki akses untuk mengelola user. Hanya admin dan moderator dengan jabatan Ketua/Wakil Ketua yang dapat mengelola user.";
                          }
                        })()}
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
                    onPress={handleUserSubmit}
                    isLoading={isSubmitting}
                    isDisabled={!!(formData.password && !passwordValidation.isValid)}
                  >
                    {editingUser ? 'Update' : 'Create'}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteOpen}
          onClose={() => {
            onDeleteClose();
            setDeleteUserId(null);
          }}
          placement="top-center"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  Konfirmasi Hapus User
                </ModalHeader>
                <ModalBody>
                  <p className="text-gray-600 dark:text-gray-400">
                    Apakah Anda yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan.
                  </p>
                </ModalBody>
                <ModalFooter>
                  <Button 
                    color="default" 
                    variant="flat" 
                    onPress={onClose}
                  >
                    Cancel
                  </Button>
                  <Button 
                    color="danger" 
                    onPress={handleDelete}
                    isLoading={isSubmitting}
                  >
                    Ya, Hapus
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
    </ModeratorLayout>
  );
}
