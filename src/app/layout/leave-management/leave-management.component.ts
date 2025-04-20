import { Component, OnInit } from '@angular/core';
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
    selectedId: string | null = null;
    isEditing = false;
    isLoading = true;
    isSubmitting = false;
    user: any;
    activeTab: 'balances' | 'types' | 'holidays' = 'balances';
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
            next: (data) => {
                this.leaveTypes = data;
            },
            error: (error) => {
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
                this.users = data;
            },
            error: (error) => {
                console.error('Error loading users:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to load users',
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

    deleteLeaveType(id: number): void {
        Swal.fire({
            title: 'Are you sure?',
            text: 'You will not be able to recover this leave type!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#10B981',
            cancelButtonColor: '#EF4444',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                this.leaveBalanceService.deleteLeaveType(id).subscribe({
                    next: () => {
                        Swal.fire({
                            title: 'Deleted!',
                            text: 'Leave type has been deleted.',
                            icon: 'success',
                            confirmButtonColor: '#10B981'
                        });
                        this.loadLeaveTypes();
                    },
                    error: (error) => {
                        console.error('Error deleting leave type:', error);
                        Swal.fire({
                            title: 'Error',
                            text: 'Failed to delete leave type',
                            icon: 'error',
                            confirmButtonColor: '#10B981'
                        });
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

    closeModal(): void {
        this.isModalOpen = false;
        this.selectedBalance = null;
        this.selectedId = null;
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
                        text: 'Failed to create leave balance',
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
} 