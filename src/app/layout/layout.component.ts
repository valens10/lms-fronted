import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { NavbarComponent } from './navbar/navbar.component';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, SidebarComponent],
  templateUrl: './layout.component.html',
  styles: []
})
export class LayoutComponent implements OnInit {
  isSidebarOpen = true;
  user: any;

  constructor(private authService: AuthService) {
    this.user = JSON.parse(sessionStorage.getItem('user') || '{}');
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  ngOnInit() {
    const user = sessionStorage.getItem('user');
    const token = sessionStorage.getItem('token');

    if (!user || !token) {
      window.location.href = '/auth/login';
    }
  }
} 