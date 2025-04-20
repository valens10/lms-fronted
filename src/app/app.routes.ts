import { Routes } from '@angular/router';
import { LeaveManagementComponent } from './layout/leave-management/leave-management.component';
import { UsersComponent } from './layout/users/users.component';
import { LoginComponent } from './auth/login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LeaveRequestsComponent } from './layout/leave-requests/leave-requests.component';
import { AuthGuard } from './auth/auth.guard';
import { LayoutComponent } from './layout/layout.component';
import { CurrentLeavesComponent } from './layout/current-leaves/current-leaves.component';
import { MyWorkflowsComponent } from './layout/my-workflows/my-workflows.component';

export const routes: Routes = [
    { path: '', redirectTo: '/pages/login', pathMatch: 'full' },
    { path: 'pages/login', component: LoginComponent },
    { path: 'oauth2/success', component: LoginComponent },
    {
        path: 'pages',
        canActivate: [AuthGuard],
        component: LayoutComponent,
        children: [
            { path: 'dashboard', component: DashboardComponent },
            { path: 'leaves', component: LeaveManagementComponent },
            { path: 'leave-requests', component: LeaveRequestsComponent },
            { path: 'users', component: UsersComponent },
            { path: 'current-leaves', component: CurrentLeavesComponent },
            { path: 'my-leave-workflows', component: MyWorkflowsComponent }
        ]
    }
];
