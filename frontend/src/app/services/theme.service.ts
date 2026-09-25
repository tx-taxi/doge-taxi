import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { defaultMempoolFeeColors, dogecoinMempoolFeeColors, contrastMempoolFeeColors, lightMempoolFeeColors } from '@app/app.constants';
import { StorageService } from '@app/services/storage.service';
import { StateService } from '@app/services/state.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  style: HTMLLinkElement | null = null;
  theme: string = 'default';
  themeState$: BehaviorSubject<{ theme: string; loading: boolean; }>;
  mempoolFeeColors: string[] = dogecoinMempoolFeeColors;
  initialLoad: boolean = true;

  constructor(
    private storageService: StorageService,
    private stateService: StateService,
  ) {
    let theme = this.stateService.env.customize?.theme || this.storageService.getValue('theme-preference') || 'default';
    // theme preference must be a valid known public theme
    if (!this.stateService.env.customize?.theme && !['default', 'original'].includes(theme)) {
      theme = 'default';
      this.storageService.setValue('theme-preference', 'default');
    }
    this.clearAprilTheme();
    this.themeState$ = new BehaviorSubject({ theme, loading: false });
    this.apply(theme);
  }

  setTheme(theme: string): void {
    this.clearAprilTheme();
    this.apply(theme);
  }

  clearAprilTheme(): void {
    this.storageService.removeItem('april-theme');
    this.storageService.removeItem('april-theme-backup');
  }

  private apply(theme: string): void {
    document.documentElement.dataset.theme = theme;
    this.style ||= document.getElementById('mempool-original-theme') as HTMLLinkElement | null;
    if (this.theme === theme && !this.style) {
      return;
    }

    this.theme = theme;
    if (theme === 'default') {
      if (this.style) {
        this.style.remove();
        this.style = null;
      }
      if (!this.stateService.env.customize?.theme) {
        this.storageService.setValue('theme-preference', theme);
      }
      this.mempoolFeeColors = dogecoinMempoolFeeColors;
      this.themeState$.next({ theme, loading: false });
      return;
    }

    // Load theme stylesheet
    this.themeState$.next({ theme, loading: true });
    try {
      if (!this.style) {
        this.style = document.createElement('link');
        this.style.rel = 'stylesheet';
        this.style.id = 'mempool-original-theme';
        if (this.initialLoad) {
          this.style.media = 'print'; // Prevent white flash and other CSS issues when using custom theme on initial app load in Safari
        }
        document.head.appendChild(this.style); // load the css now
      }

      const finishLoading = () => {
        if (this.initialLoad) {
          this.style.media = 'all';
          this.initialLoad = false;
        }
        this.mempoolFeeColors = this.getMempoolFeeColors(theme);
        this.themeState$.next({ theme, loading: false });
      };
      this.style.onload = finishLoading;
      this.style.onerror = () => this.apply('default');
      // Preserve framework specificity; place the adopted Original layer after native CSS.
      document.head.appendChild(this.style);
      const themeFile = this.getThemeFile(theme);
      if (this.style.getAttribute('href') === themeFile && this.style.sheet) {
        finishLoading();
      } else {
        this.style.href = themeFile;
      }

      if (!this.stateService.env.customize?.theme) {
        this.storageService.setValue('theme-preference', theme);
      }
    } catch (err) {
      console.log('failed to apply theme stylesheet: ', err);
      this.apply('default');
    }
  }

  private getThemeFile(theme: string): string {
    if (theme === 'original') {
      return '/resources/mempool-original.css?v=20260925-complete';
    }
    const themeFiles = (window as any).__env?.THEME_FILES;
    if (themeFiles?.[theme]) {
      return themeFiles[theme];
    }
    return `${theme}.css`;
  }

  private getMempoolFeeColors(theme: string): string[] {
    switch (theme) {
      case 'contrast':
      case 'bukele':
        return contrastMempoolFeeColors;
      case 'nymkappa':
        return lightMempoolFeeColors;
      default:
        return defaultMempoolFeeColors;
    }
  }

  private isAprilFirst(): boolean {
    const now = new Date();
    return now.getMonth() === 3 && now.getDate() === 1;
  }
}
