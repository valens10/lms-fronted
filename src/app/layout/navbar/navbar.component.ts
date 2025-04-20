import { Component, Output, EventEmitter, ElementRef, ViewChild, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaveBalanceService } from '../../services/leave-balance.service';
import Swal from 'sweetalert2';

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    roles: string[];
}

@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './navbar.component.html',
    styles: []
})
export class NavbarComponent implements OnInit {
    @Output() toggleSidebar = new EventEmitter<void>();
    @ViewChild('userMenuContainer') userMenuContainer!: ElementRef;
    @ViewChild('notificationContainer') notificationContainer!: ElementRef;

    isUserMenuOpen = false;
    user: User = JSON.parse(sessionStorage.getItem('user') || '{}');
    unreadCount = 0;
    notifications: any[] = [];
    isNotificationPanelOpen = false;
    isLoading = false;

    constructor(private leaveBalanceService: LeaveBalanceService) { }

    ngOnInit(): void {
        this.loadUnreadCount();
        // Refresh count every 30 seconds
        setInterval(() => this.loadUnreadCount(), 30000);
    }

    loadUnreadCount(): void {
        this.leaveBalanceService.getUnreadNotificationCount().subscribe({
            next: (count) => {
                this.unreadCount = count;
            },
            error: (error) => {
                console.error('Error loading notification count:', error);
            }
        });
    }

    get fullName(): string {
        return `${this.user.firstName} ${this.user.lastName}`.trim();
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        if (this.userMenuContainer?.nativeElement && !this.userMenuContainer.nativeElement.contains(event.target)) {
            this.isUserMenuOpen = false;
        }
        if (this.notificationContainer?.nativeElement && !this.notificationContainer.nativeElement.contains(event.target)) {
            this.isNotificationPanelOpen = false;
        }
    }

    toggleUserMenu() {
        this.isUserMenuOpen = !this.isUserMenuOpen;
    }

    toggleNotificationPanel(): void {
        this.isNotificationPanelOpen = !this.isNotificationPanelOpen;
        if (this.isNotificationPanelOpen) {
            this.loadNotifications();
        }
    }

    loadNotifications(): void {
        this.isLoading = true;
        this.leaveBalanceService.getNotifications().subscribe({
            next: (data) => {
                this.notifications = data;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading notifications:', error);
                this.isLoading = false;
            }
        });
    }

    markAsRead(notificationId: number): void {
        this.leaveBalanceService.markNotificationAsRead(notificationId).subscribe({
            next: () => {
                // Update local state
                const notification = this.notifications.find(n => n.id === notificationId);
                if (notification) {
                    notification.read = true;
                }
                this.unreadCount = Math.max(0, this.unreadCount - 1);

                this.loadNotifications();
                this.loadUnreadCount();
            },
            error: (error) => {
                console.error('Error marking notification as read:', error);
            }
        });
    }

    formatDate(dateString: string): string {
        return new Date(dateString).toLocaleString();
    }

    getNotificationMessage(message: string): string {
        const lines = message.split('\n');
        // Find the line that contains the application number
        const contentLine = lines.find(line => line.includes('application #'));
        return contentLine || message;
    }

    logout(): void {
        sessionStorage.clear();
        window.location.href = '/auth/login';
    }
} 