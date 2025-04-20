import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeaveBalanceService } from '../../services/leave-balance.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-users',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './users.component.html',
    styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
    users: any[] = [];
    roles: string[] = [];
    isLoading = true;
    isSubmitting = false;
    selectedUser: any = null;
    isModalOpen = false;
    currentUser: any;

    constructor(private leaveBalanceService: LeaveBalanceService) {
        this.currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
    }

    isAdmin(): boolean {
        return this.currentUser?.roles?.includes('ROLE_ADMIN');
    }

    ngOnInit(): void {
        this.loadUsers();
        this.loadRoles();
    }

    loadUsers(): void {
        this.isLoading = true;
        this.leaveBalanceService.getUsers().subscribe({
            next: (data) => {
                this.users = data;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading users:', error);
                this.isLoading = false;
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to load users',
                    icon: 'error',
                    confirmButtonColor: '#10B981'
                });
            }
        });
    }

    loadRoles(): void {
        this.leaveBalanceService.getRoles().subscribe({
            next: (data) => {
                this.roles = data;
            },
            error: (error) => {
                console.error('Error loading roles:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to load roles',
                    icon: 'error',
                    confirmButtonColor: '#10B981'
                });
            }
        });
    }

    openRoleModal(user: any): void {
        this.selectedUser = { ...user, role: user.roles[0] };
        this.isModalOpen = true;
    }

    closeModal(): void {
        this.selectedUser = null;
        this.isModalOpen = false;
    }

    updateUserRole(): void {
        if (!this.selectedUser || !this.selectedUser.role) {
            Swal.fire({
                title: 'Error',
                text: 'Please select a role',
                icon: 'error',
                confirmButtonColor: '#10B981'
            });
            return;
        }

        this.isSubmitting = true;
        this.leaveBalanceService.updateUserRole(this.selectedUser.id, this.selectedUser.role).subscribe({
            next: () => {
                Swal.fire({
                    title: 'Success',
                    text: 'User role updated successfully',
                    icon: 'success',
                    confirmButtonColor: '#10B981'
                }).then(() => {
                    this.loadUsers();
                    this.closeModal();
                });
            },
            error: (error) => {
                this.isSubmitting = false;
                console.error('Error updating user role:', error);
                Swal.fire({
                    title: 'Error',
                    text: error.error.message || 'Failed to update user role',
                    icon: 'error',
                    confirmButtonColor: '#10B981'
                });
            },
            complete: () => {
                this.isSubmitting = false;
            }
        });
    }

    deleteUser(userId: number): void {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#10B981',
            cancelButtonColor: '#EF4444',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                this.leaveBalanceService.deleteUser(userId).subscribe({
                    next: () => {
                        Swal.fire({
                            title: 'Deleted!',
                            text: 'User has been deleted.',
                            icon: 'success',
                            confirmButtonColor: '#10B981'
                        }).then(() => {
                            this.loadUsers();
                        });
                    },
                    error: (error) => {
                        console.error('Error deleting user:', error);
                        Swal.fire({
                            title: 'Error',
                            text: 'Failed to delete user due to leave dependency',
                            icon: 'error',
                            confirmButtonColor: '#10B981'
                        });
                    }
                });
            }
        });
    }
} 