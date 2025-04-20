import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LeaveBalanceService } from '../../services/leave-balance.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-leave-requests',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './leave-requests.component.html',
    styleUrls: ['./leave-requests.component.css']
})
export class LeaveRequestsComponent implements OnInit {
    leaveRequests: any[] = [];
    isLoading = true;
    user: any;
    hostUrl: string;

    constructor(
        private leaveBalanceService: LeaveBalanceService,
        private router: Router
    ) {
        this.user = JSON.parse(sessionStorage.getItem('user') || '{}');
        this.hostUrl = this.router.url.split('/')[0];
    }

    ngOnInit(): void {
        this.loadLeaveRequests();
    }

    loadLeaveRequests(): void {
        this.isLoading = true;
        this.leaveBalanceService.getLeaveRequests().subscribe({
            next: (data) => {
                this.leaveRequests = data;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading leave requests:', error);
                this.isLoading = false;
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to load leave requests',
                    icon: 'error',
                    confirmButtonColor: '#10B981'
                });
            }
        });
    }

    approveRequest(requestId: string): void {
        Swal.fire({
            title: 'Approve Leave Request',
            input: 'textarea',
            inputLabel: 'Comments',
            inputPlaceholder: 'Enter your comments here...',
            showCancelButton: true,
            confirmButtonText: 'Approve',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#10B981',
            showLoaderOnConfirm: true,
            preConfirm: (comments) => {
                return comments;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this.leaveBalanceService.approveLeaveRequest(requestId, result.value).subscribe({
                    next: () => {
                        Swal.fire({
                            title: 'Success',
                            text: 'Leave request approved successfully',
                            icon: 'success',
                            confirmButtonColor: '#10B981'
                        }).then(() => {
                            this.loadLeaveRequests();
                        });
                    },
                    error: (error) => {
                        console.error('Error approving leave request:', error);
                        Swal.fire({
                            title: 'Error',
                            text: error.error.message,
                            icon: 'error',
                            confirmButtonColor: '#10B981'
                        });
                    }
                });
            }
        });
    }

    rejectRequest(requestId: string): void {
        Swal.fire({
            title: 'Reject Leave Request',
            input: 'textarea',
            inputLabel: 'Comments',
            inputPlaceholder: 'Enter your comments here...',
            showCancelButton: true,
            confirmButtonText: 'Reject',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#EF4444',
            showLoaderOnConfirm: true,
            preConfirm: (comments) => {
                if (!comments) {
                    Swal.showValidationMessage('Please enter comments');
                }
                return comments;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this.leaveBalanceService.rejectLeaveRequest(requestId, result.value).subscribe({
                    next: () => {
                        Swal.fire({
                            title: 'Success',
                            text: 'Leave request rejected successfully',
                            icon: 'success',
                            confirmButtonColor: '#10B981'
                        }).then(() => {
                            this.loadLeaveRequests();
                        });
                    },
                    error: (error) => {
                        console.error('Error rejecting leave request:', error);
                        Swal.fire({
                            title: 'Error',
                            text: 'Failed to reject leave request',
                            icon: 'error',
                            confirmButtonColor: '#10B981'
                        });
                    }
                });
            }
        });
    }

    viewLeaveAttachment(fileName: string): void {
        this.leaveBalanceService.viewLeaveAttachment(fileName)
    }
} 