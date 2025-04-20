import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LeaveBalanceService } from '../../services/leave-balance.service';
import { FilterPipe } from '../../pipes/filter.pipe';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-leave-management',
    standalone: true,
    imports: [CommonModule, FormsModule, FilterPipe],
    templateUrl: './leave-management.component.html',
    styles: []
})
export class LeaveManagementComponent implements OnInit {
    leaveBalances: any[] = [];
    leaveTypes: any[] = [];
    holidays: any[] = [];
    users: any[] = [];
    isModalOpen = false;
    selectedBalance: any = null;
    selectedHoliday: any = null;
    selectedLeaveType: any = null;
    selectedId: string | null = null;
    isEditing = false;
    isLoading = true;
    isSubmitting = false;
    user: any;
    activeTab: 'balances' | 'types' | 'holidays' | 'departments' = 'balances';
    isViewingDetails = false;
    newLeaveType: any = {
        name: '',
        description: '',
        maxDays: 0,
        isPaid: true,
        requiresApproval: true,
        isAnnualLeave: false
    };
    newHoliday: any = {
        name: '',
        date: '',
        description: ''
    };
    departments: any[] = [];
    selectedDepartment: any = null;
    newDepartment: any = {
        name: '',
        description: '',
        userIds: []
    };
    searchTerm: string = '';
    isDropdownOpen: boolean = false;
    filteredUsers: any[] = [];

    constructor(
        private leaveBalanceService: LeaveBalanceService,
        private router: Router
    ) {
        this.user = JSON.parse(sessionStorage.getItem('user') || '{}');
        if (!this.user.roles?.some((role: string) => ['ROLE_ADMIN', 'ROLE_MANAGER'].includes(role))) {
            this.router.navigate(['/pages/dashboard']);
            Swal.fire({
                title: 'Access Denied',
                text: 'You do not have permission to access this page',
                icon: 'error',
                confirmButtonColor: '#10B981'
            });
        }
    }

    ngOnInit(): void {
        this.loadLeaveBalances();
        this.loadLeaveTypes();
        this.loadUsers();
        this.loadHolidays();
        this.loadDepartments();
    }

    loadLeaveBalances(): void {
        this.isLoading = true;
        this.leaveBalanceService.getLeaveBalances().subscribe({
            next: (data) => {
                this.leaveBalances = data;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading leave balances:', error);
                this.isLoading = false;
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to load leave balances',
                    icon: 'error',
                    confirmButtonColor: '#10B981'
                });
            }
        });
    }

    loadLeaveTypes(): void {
        this.leaveBalanceService.getLeaveTypes().subscribe({
            next: (types) => {
                this.leaveTypes = types;
            },
            error: (error: any) => {
                console.error('Error loading leave types:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to load leave types',
                    icon: 'error',
                    confirmButtonColor: '#10B981'
                });
            }
        });
    }

    loadUsers(): void {
        this.leaveBalanceService.getUsers().subscribe({
            next: (data) => {
                if (Array.isArray(data)) {
                    this.users = data;
                    this.filteredUsers = [...this.users];
                } else {
                    console.error('Invalid users data:', data);
                    this.users = [];
                    this.filteredUsers = [];
                }
            },
            error: (error) => {
                console.error('Error loading users:', error);
                this.users = [];
                this.filteredUsers = [];
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to load users. Please try again.',
                    icon: 'error',
                    confirmButtonColor: '#10B981'
                });
            }
        });
    }

    loadHolidays(): void {
        this.leaveBalanceService.getHolidays().subscribe({
            next: (data) => {
                this.holidays = data;
            },
            error: (error) => {
                console.error('Error loading holidays:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to load holidays',
                    icon: 'error',
                    confirmButtonColor: '#10B981'
                });
            }
        });
    }

    loadDepartments(): void {
        this.leaveBalanceService.getDepartments().subscribe({
            next: (data) => {
                this.departments = data.map(dept => ({
                    id: dept.id,
                    name: dept.name,
                    description: dept.description,
                    users: dept.users?.map((user: any) => ({
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email
                    })) || []
                }));
            },
            error: (error) => {
                console.error('Error loading departments:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to load departments',
                    icon: 'error',
                    confirmButtonColor: '#10B981'
                });
            }
        });
    }

    createLeaveType(): void {
        this.isSubmitting = true;
        this.leaveBalanceService.createLeaveType(this.newLeaveType).subscribe({
            next: () => {
                this.isSubmitting = false;
                this.isModalOpen = false;
                Swal.fire({
                    title: 'Success',
                    text: 'Leave type created successfully',
                    icon: 'success',
                    confirmButtonColor: '#10B981'
                }).then(() => {
                    this.loadLeaveTypes();
                    this.newLeaveType = {
                        name: '',
                        description: '',
                        maxDays: 0,
                        isPaid: true,
                        requiresApproval: true,
                        isAnnualLeave: false
                    };
                });
            },
            error: (error) => {
                this.isSubmitting = false;
                console.error('Error creating leave type:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to create leave type',
                    icon: 'error',
                    confirmButtonColor: '#10B981'
                });
            }
        });
    }

    updateLeaveType(leaveType: any): void {
        this.leaveBalanceService.updateLeaveType(leaveType.id, leaveType).subscribe({
            next: () => {
                Swal.fire({
                    title: 'Success',
                    text: 'Leave type updated successfully',
                    icon: 'success',
                    confirmButtonColor: '#10B981'
                });
                this.loadLeaveTypes();
                this.isModalOpen = false;
            },
            error: (error: any) => {
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to update leave type',
                    icon: 'error',
                    confirmButtonColor: '#10B981'
                });
                console.error('Error updating leave type:', error);
            }
        });
    }

    deleteLeaveType(leaveTypeId: number): void {
        Swal.fire({
            title: 'Are you sure?',
            text: 'This action cannot be undone',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it',
            cancelButtonText: 'No, keep it',
            confirmButtonColor: '#10B981'
        }).then((result) => {
            if (result.isConfirmed) {
                this.leaveBalanceService.deleteLeaveType(leaveTypeId).subscribe({
                    next: () => {
                        Swal.fire({
                            title: 'Deleted!',
                            text: 'Leave type has been deleted',
                            icon: 'success',
                            confirmButtonColor: '#10B981'
                        });
                        this.loadLeaveTypes();
                    },
                    error: (error: any) => {
                        Swal.fire({
                            title: 'Error',
                            text: 'Failed to delete leave type',
                            icon: 'error',
                            confirmButtonColor: '#10B981'
                        });
                        console.error('Error deleting leave type:', error);
                    }
                });
            }
        });
    }

    getLeaveTypeById(typeId: number): any {
        return this.leaveTypes.find(type => type.id === typeId);
    }

    openAddModal(): void {
        this.isEditing = false;
        this.selectedId = null;
        this.selectedBalance = {
            userId: 0,
            leaveTypeId: 0,
            balance: 0
        };
        this.isModalOpen = true;
    }

    openEditModal(balance: any): void {
        this.isEditing = true;
        this.selectedId = balance.id;
        this.selectedBalance = {
            userId: balance.user.id,
            leaveTypeId: balance.leaveType.id,
            balance: balance.balance,
            validUntil: balance.validUntil
        };
        this.isModalOpen = true;
    }

    openEditLeaveTypeModal(leaveType: any): void {
        this.selectedLeaveType = { ...leaveType };
        this.isModalOpen = true;
    }

    openViewDetailsModal(balance: any): void {
        this.selectedBalance = balance;
        this.isViewingDetails = true;
        this.isModalOpen = true;
    }

    closeModal(): void {
        this.isModalOpen = false;
        this.selectedBalance = null;
        this.selectedHoliday = null;
        this.selectedLeaveType = null;
        this.selectedId = null;
        this.isViewingDetails = false;
        this.resetDepartmentForm();
    }

    saveBalance(): void {
        if (!this.selectedBalance) return;

        if (!this.selectedBalance.leaveTypeId || !this.selectedBalance.userId || !this.selectedBalance.balance) {
            Swal.fire({
                title: 'Validation Error',
                text: 'Please fill in all required fields',
                icon: 'warning',
                confirmButtonColor: '#10B981'
            });
            return;
        }

        this.isSubmitting = true;

        if (this.isEditing && this.selectedId) {
            // Update operation
            const payload = {
                balance: this.selectedBalance.balance,
                validUntil: this.selectedBalance.validUntil
            };

            this.leaveBalanceService.updateLeaveBalance(this.selectedId, payload).subscribe({
                next: () => {
                    this.isSubmitting = false;
                    Swal.fire({
                        title: 'Success',
                        text: 'Leave balance updated successfully',
                        icon: 'success',
                        confirmButtonColor: '#10B981'
                    }).then(() => {
                        this.closeModal();
                        this.loadLeaveBalances();
                    });
                },
                error: (error) => {
                    this.isSubmitting = false;
                    console.error('Error updating leave balance:', error);
                    Swal.fire({
                        title: 'Error',
                        text: 'Failed to update leave balance',
                        icon: 'error',
                        confirmButtonColor: '#10B981'
                    });
                }
            });
        } else {
            // Create operation
            const payload = {
                userId: this.selectedBalance.userId,
                leaveTypeId: this.selectedBalance.leaveTypeId,
                balance: this.selectedBalance.balance
            };

            this.leaveBalanceService.createLeaveBalance(payload).subscribe({
                next: () => {
                    this.isSubmitting = false;
                    Swal.fire({
                        title: 'Success',
                        text: 'Leave balance created successfully',
                        icon: 'success',
                        confirmButtonColor: '#10B981'
                    }).then(() => {
                        this.closeModal();
                        this.loadLeaveBalances();
                    });
                },
                error: (error) => {
                    this.isSubmitting = false;
                    console.error('Error creating leave balance:', error);
                    Swal.fire({
                        title: 'Error',
                        text: error.error.message || 'Failed to create leave balance',
                        icon: 'error',
                        confirmButtonColor: '#10B981'
                    });
                }
            });
        }
    }

    deleteBalance(id: string): void {
        Swal.fire({
            title: 'Are you sure?',
            text: 'You will not be able to recover this leave balance!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#10B981',
            cancelButtonColor: '#EF4444',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                this.leaveBalanceService.deleteLeaveBalance(id).subscribe({
                    next: () => {
                        Swal.fire({
                            title: 'Deleted!',
                            text: 'Leave balance has been deleted.',
                            icon: 'success',
                            confirmButtonColor: '#10B981'
                        });
                        this.loadLeaveBalances();
                    },
                    error: (error) => {
                        console.error('Error deleting leave balance:', error);
                        Swal.fire({
                            title: 'Error',
                            text: 'Failed to delete leave balance',
                            icon: 'error',
                            confirmButtonColor: '#10B981'
                        });
                    }
                });
            }
        });
    }

    createHoliday(): void {
        this.isSubmitting = true;
        this.leaveBalanceService.createHoliday(this.newHoliday).subscribe({
            next: () => {
                this.isSubmitting = false;
                this.isModalOpen = false;
                Swal.fire({
                    title: 'Success',
                    text: 'Holiday created successfully',
                    icon: 'success',
                    confirmButtonColor: '#10B981'
                }).then(() => {
                    this.loadHolidays();
                    this.newHoliday = {
                        name: '',
                        date: '',
                        description: ''
                    };
                });
            },
            error: (error) => {
                this.isSubmitting = false;
                console.error('Error creating holiday:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to create holiday',
                    icon: 'error',
                    confirmButtonColor: '#10B981'
                });
            }
        });
    }

    deleteHoliday(id: number): void {
        Swal.fire({
            title: 'Are you sure?',
            text: 'You will not be able to recover this holiday!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#10B981',
            cancelButtonColor: '#EF4444',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                this.leaveBalanceService.deleteHoliday(id).subscribe({
                    next: () => {
                        Swal.fire({
                            title: 'Deleted!',
                            text: 'Holiday has been deleted.',
                            icon: 'success',
                            confirmButtonColor: '#10B981'
                        });
                        this.loadHolidays();
                    },
                    error: (error) => {
                        console.error('Error deleting holiday:', error);
                        Swal.fire({
                            title: 'Error',
                            text: 'Failed to delete holiday',
                            icon: 'error',
                            confirmButtonColor: '#10B981'
                        });
                    }
                });
            }
        });
    }

    createDepartment(): void {
        this.isSubmitting = true;
        const payload = {
            name: this.newDepartment.name,
            description: this.newDepartment.description,
            userIds: this.newDepartment.userIds || []
        };

        this.leaveBalanceService.createDepartment(payload).subscribe({
            next: () => {
                this.isSubmitting = false;
                this.isModalOpen = false;
                Swal.fire({
                    title: 'Success',
                    text: 'Department created successfully',
                    icon: 'success',
                    confirmButtonColor: '#10B981'
                }).then(() => {
                    this.loadDepartments();
                    this.resetDepartmentForm();
                });
            },
            error: (error) => {
                this.isSubmitting = false;
                console.error('Error creating department:', error);
                Swal.fire({
                    title: 'Error',
                    text: error.error?.message || 'Failed to create department',
                    icon: 'error',
                    confirmButtonColor: '#10B981'
                });
            }
        });
    }

    updateDepartment(department: any): void {
        this.isSubmitting = true;
        const payload = {
            name: this.newDepartment.name,
            description: this.newDepartment.description,
            userIds: this.newDepartment.userIds || []
        };

        this.leaveBalanceService.updateDepartment(department.id, payload).subscribe({
            next: () => {
                this.isSubmitting = false;
                this.isModalOpen = false;
                Swal.fire({
                    title: 'Success',
                    text: 'Department updated successfully',
                    icon: 'success',
                    confirmButtonColor: '#10B981'
                }).then(() => {
                    this.loadDepartments();
                    this.resetDepartmentForm();
                });
            },
            error: (error) => {
                this.isSubmitting = false;
                console.error('Error updating department:', error);
                Swal.fire({
                    title: 'Error',
                    text: error.error?.message || 'Failed to update department',
                    icon: 'error',
                    confirmButtonColor: '#10B981'
                });
            }
        });
    }

    deleteDepartment(departmentId: number): void {
        Swal.fire({
            title: 'Are you sure?',
            text: 'This action cannot be undone',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it',
            cancelButtonText: 'No, keep it',
            confirmButtonColor: '#10B981'
        }).then((result) => {
            if (result.isConfirmed) {
                this.leaveBalanceService.deleteDepartment(departmentId).subscribe({
                    next: () => {
                        Swal.fire({
                            title: 'Deleted!',
                            text: 'Department has been deleted',
                            icon: 'success',
                            confirmButtonColor: '#10B981'
                        });
                        this.loadDepartments();
                    },
                    error: (error) => {
                        Swal.fire({
                            title: 'Error',
                            text: 'Employees should be removed from the department before deleting it',
                            icon: 'error',
                            confirmButtonColor: '#10B981'
                        });
                        console.error('Error deleting department:', error);
                    }
                });
            }
        });
    }

    openEditDepartmentModal(department: any): void {
        this.selectedDepartment = {
            id: department.id,
            name: department.name,
            description: department.description
        };

        this.newDepartment = {
            name: department.name,
            description: department.description,
            userIds: department.users?.map((user: any) => user.id) || []
        };
        this.isModalOpen = true;
    }

    onUserSelection(userId: string, event: Event): void {
        const checkbox = event.target as HTMLInputElement;
        if (!this.newDepartment.userIds) {
            this.newDepartment.userIds = [];
        }

        if (checkbox.checked) {
            // Add user if not already selected
            if (!this.newDepartment.userIds.includes(userId)) {
                this.newDepartment.userIds.push(userId);
            }
        } else {
            // Remove user if unchecked
            this.newDepartment.userIds = this.newDepartment.userIds.filter((id: string) => id !== userId);
        }
    }

    filterUsers(): void {
        if (!this.searchTerm) {
            this.filteredUsers = [...this.users];
            return;
        }
        const searchLower = this.searchTerm.toLowerCase();
        this.filteredUsers = this.users.filter(user =>
        (user?.firstName?.toLowerCase().includes(searchLower) ||
            user?.lastName?.toLowerCase().includes(searchLower))
        );
    }

    toggleUser(userId: string): void {
        if (!this.newDepartment.userIds) {
            this.newDepartment.userIds = [];
        }

        const index = this.newDepartment.userIds.indexOf(userId);
        if (index === -1) {
            this.newDepartment.userIds.push(userId);
        } else {
            this.newDepartment.userIds.splice(index, 1);
        }
        console.log('Current userIds:', this.newDepartment.userIds); // Debug log
    }

    removeUser(userId: string): void {
        if (!this.newDepartment.userIds) return;
        this.newDepartment.userIds = this.newDepartment.userIds.filter((id: string) => id !== userId);
    }

    getUserName(userId: string): string {
        const user = this.users.find(u => u.id === userId);
        return user ? `${user.firstName} ${user.lastName}` : '';
    }

    resetDepartmentForm(): void {
        this.newDepartment = {
            name: '',
            description: '',
            userIds: []
        };
        this.selectedDepartment = null;
        this.searchTerm = '';
        this.filteredUsers = [...this.users];
    }

    // Close dropdown when clicking outside
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (!target.closest('.relative')) {
            this.isDropdownOpen = false;
        }
    }
} 