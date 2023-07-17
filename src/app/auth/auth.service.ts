import { HttpClient } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { AuthData } from './auth-data.model';
import { Subject } from 'rxjs';
import { Router } from '@angular/router';

import { environment } from 'src/environments/environment';

const url = environment.apiUrl;
const urlPath = '/api/user';

@Injectable({ providedIn: 'root' })
export class AuthService implements OnInit {
  private isAuthenticated = false;
  private token: string;
  private authStatusListener = new Subject<boolean>();
  private tokenTimer: NodeJS.Timer;
  private userId: string;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {}

  getAuthStatusListener() {
    return this.authStatusListener.asObservable();
  }

  getIsAuth() {
    return this.isAuthenticated;
  }

  getUserId() {
    return this.userId;
  }

  createUser(email: string, password: string) {
    const constructedUrl = new URL(`${urlPath}/signup`, url);
    const authData: AuthData = { email, password };
    return this.http.post<any>(constructedUrl.href, authData).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: () => {
        this.authStatusListener.next(false);
      },
    });
  }

  login(email: string, password: string) {
    const constructedUrl = new URL(`${urlPath}/login`, url);
    const authData: AuthData = { email, password };

    this.http
      .post<{ token: string; expiresInSeconds: number; userId: string }>(
        constructedUrl.href,
        authData
      )
      .subscribe({
        next: (res) => {
          this.token = res.token;
          if (res.token) {
            const expiresInMilliseconds = res.expiresInSeconds * 1000;
            this.setAuthTimer(expiresInMilliseconds);
            this.isAuthenticated = true;
            this.userId = res.userId;
            this.authStatusListener.next(true);
            const now = new Date();
            const expirationDate = new Date(
              now.getTime() + expiresInMilliseconds
            );
            this.saveAuthData(this.token, expirationDate, this.userId);
            this.router.navigate(['/']);
          }
        },
        error: () => {
          this.authStatusListener.next(false);
        },
      });
  }

  logout() {
    this.token = null;
    this.isAuthenticated = false;
    this.authStatusListener.next(false);
    this.userId = null;
    this.clearAuthData();
    clearTimeout(this.tokenTimer);
    this.router.navigate(['/']);
  }

  getToken() {
    return this.token;
  }

  autoAuthUser() {
    const authInfo = this.getAuthData();
    if (!authInfo) {
      return;
    }
    const now = new Date();
    if (authInfo.expirationDate > now) {
      this.token = authInfo.token;
      this.isAuthenticated = true;
      this.userId = authInfo.userId;
      this.setAuthTimer(authInfo.expirationDate.getTime() - now.getTime());
      this.authStatusListener.next(true);
    }
  }

  private saveAuthData(token: string, expirationDate: Date, userId: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('expirationDate', expirationDate.toISOString());
    localStorage.setItem('userId', userId);
  }

  private clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('expirationDate');
    localStorage.removeItem('userId');
  }

  private getAuthData() {
    const token = localStorage.getItem('token');
    const expirationDate = localStorage.getItem('expirationDate');
    const userId = localStorage.getItem('userId');
    if (!token || !expirationDate) {
      return;
    }
    return {
      token,
      expirationDate: new Date(expirationDate),
      userId,
    };
  }

  private setAuthTimer(durationInMilliseconds: number) {
    this.tokenTimer = setTimeout(() => {
      this.logout();
    }, durationInMilliseconds);
  }
}
