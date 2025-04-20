import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule,],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  isLoading = false;
  error: string | null = null;
  token: any = 'null';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
  ) { }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.token = params.get('token');

      if (this.token) {
        this.login();
      }
    });
  }

  login(): void {
    this.isLoading = true;
    this.authService.login(this.token).subscribe({
      next: (response) => {
        console.log('response', response);
        sessionStorage.setItem('token', this.token);
        sessionStorage.setItem('user', JSON.stringify(response));
        this.isLoading = false;

        window.location.href = '/pages/dashboard'; // TODO: change to dashboard
      },
      error: (error) => {
        console.error('error', error);
        this.error = 'Login failed. Please try again.';
        this.isLoading = false;
      }
    });
  }

  async signInWithGoogle(): Promise<void> {
    if (this.isLoading) return;


    this.error = null;

    try {
      this.authService.loginWithGoogle();
    } catch (err) {
      this.error = 'Google sign-in failed. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }
} 