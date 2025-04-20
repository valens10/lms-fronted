import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LeaveBalanceService } from '../../services/leave-balance.service';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './sidebar.component.html',
    styles: [`
        .rotate-180 {
            transform: rotate(180deg);
        }
        .dropdown-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease-out;
        }
        .dropdown-content.show {
            max-height: 500px;
            transition: max-height 0.3s ease-in;
        }
        .nav-link {
            transition: all 0.2s ease;
        }
        .nav-link:hover {
            transform: translateX(4px);
        }
        ::-webkit-scrollbar {
            width: 6px;
        }
        ::-webkit-scrollbar-track {
            background: #f1f1f1;
        }
        ::-webkit-scrollbar-thumb {
            background: #10b981;
            border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #059669;
        }
    `]
})
export class SidebarComponent implements OnInit {
    @Input() isOpen: boolean = true;
    user: any;
    pendingRequestsCount: number = 0;
    private dropdownStates: { [key: string]: boolean } = {
        leave: false,
        reports: false,
        admin: false
    };

    constructor(
        private leaveBalanceService: LeaveBalanceService
    ) {
        this.user = JSON.parse(sessionStorage.getItem('user') || '{}');
    }

    ngOnInit(): void {
        if (this.hasAdminOrManagerRole()) {
            this.loadPendingRequestsCount();
        }
    }

    loadPendingRequestsCount(): void {
        this.leaveBalanceService.getPendingRequestsCount().subscribe({
            next: (response: any) => {
                this.pendingRequestsCount = response.count;
            },
            error: (error) => {
                console.error('Error loading pending requests count:', error);
            }
        });
    }

    hasAdminOrManagerRole(): boolean {
        return this.user.roles?.some((role: string) => ['ROLE_ADMIN', 'ROLE_MANAGER'].includes(role));
    }

    isDropdownOpen(key: string): boolean {
        return this.dropdownStates[key];
    }

    toggleDropdown(key: string): void {
        this.dropdownStates[key] = !this.dropdownStates[key];
    }
} 