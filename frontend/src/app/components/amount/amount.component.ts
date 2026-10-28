import { compactBlockAmount } from '@app/shared/block-format';
import { Component, OnInit, OnDestroy, Input, ChangeDetectionStrategy, ChangeDetectorRef, Inject, LOCALE_ID } from '@angular/core';
import { StateService } from '@app/services/state.service';
import { Observable, Subscription } from 'rxjs';
import { Price } from '@app/services/price.service';

@Component({
  selector: 'app-amount',
  templateUrl: './amount.component.html',
  styleUrls: ['./amount.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AmountComponent implements OnInit, OnDestroy {
  conversions$: Observable<any>;
  currency: string;
  viewAmountMode$: Observable<'btc' | 'sats' | 'fiat'>;
  network = '';

  stateSubscription: Subscription;
  currencySubscription: Subscription;

  @Input() satoshis: number | string;
  @Input() compactBlock = false;
  compactBlockAmount = (value: number | string, atomic = false) => compactBlockAmount(value, atomic, this.locale);

  @Input() digitsInfo = '1.8-8';
  @Input() noFiat = false;
  @Input() addPlus = false;
  @Input() blockConversion: Price;
  @Input() forceBtc: boolean = false;
  @Input() ignoreViewMode: boolean = false;
  @Input() forceBlockConversion: boolean = false; // true = displays fiat price as 0 if blockConversion is undefined instead of falling back to conversions
  @Input() unitStyle: any;

  constructor(
    @Inject(LOCALE_ID) private locale: string,
    private stateService: StateService,
    private cd: ChangeDetectorRef,
  ) {
    this.currencySubscription = this.stateService.fiatCurrency$.subscribe((fiat) => {
      this.currency = fiat;
      this.cd.markForCheck();
    });
  }

  exactAmount(atomic = false): string {
    if(this.satoshis == null) return '—';
    try {
      const value = BigInt(this.satoshis);
      const negative=value<0n; const absolute=negative?-value:value;
      const prefix=negative?'-':this.addPlus&&value>=0n?'+':'';
      if(atomic)return prefix+absolute.toLocaleString(this.locale);
      const match=this.digitsInfo?.match(/\.(\d+)-(\d+)$/);
      const min=Number(match?.[1] ?? 8), max=Math.min(8,Number(match?.[2] ?? 8));
      const factor=10n ** BigInt(8-max);
      const rounded=(absolute+factor/2n)/factor;
      const scale=10n ** BigInt(max);
      const integer=(rounded/scale).toLocaleString(this.locale);
      let fraction=(rounded%scale).toString().padStart(max,'0');
      while(fraction.length>min && fraction.endsWith('0'))fraction=fraction.slice(0,-1);
      const decimal = new Intl.NumberFormat(this.locale).formatToParts(1.1).find(part => part.type === 'decimal')?.value || '.';
      return prefix+integer+(fraction?decimal+fraction:'');
    } catch{return '—';}
  }

  ngOnInit() {
    this.viewAmountMode$ = this.stateService.viewAmountMode$.asObservable();
    this.conversions$ = this.stateService.conversions$.asObservable();
    this.stateSubscription = this.stateService.networkChanged$.subscribe((network) => this.network = network);
  }

  ngOnDestroy() {
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
    }
    this.currencySubscription.unsubscribe();
  }

}
