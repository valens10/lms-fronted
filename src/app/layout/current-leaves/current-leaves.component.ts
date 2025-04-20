import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaveBalanceService } from '../../services/leave-balance.service';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-current-leaves',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './current-leaves.component.html',
    styles: []
})
export class CurrentLeavesComponent implements OnInit {
    currentLeaves: any[] = [];
    isLoading = true;

    constructor(private leaveBalanceService: LeaveBalanceService) { }

    ngOnInit(): void {
        this.loadCurrentLeaves();
    }

    loadCurrentLeaves(): void {
        this.isLoading = true;
        this.leaveBalanceService.getCurrentLeaves().subscribe({
            next: (data) => {
                this.currentLeaves = data;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading current leaves:', error);
                this.isLoading = false;
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to load current leaves',
                    icon: 'error',
                    confirmButtonColor: '#10B981'
                });
            }
        });
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'APPROVED':
                return 'bg-emerald-100 text-emerald-800';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'REJECTED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }
} 