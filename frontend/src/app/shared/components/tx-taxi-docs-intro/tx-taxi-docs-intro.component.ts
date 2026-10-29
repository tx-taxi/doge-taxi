import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Input, LOCALE_ID, OnInit } from '@angular/core';
import { localizedNativeUrl, refreshLocalizedCapabilities } from '@app/services/localized-native-url';

@Component({
  selector: 'app-tx-taxi-docs-intro',
  standalone: true,
  imports: [NgIf],
  templateUrl: './tx-taxi-docs-intro.component.html',
  styleUrls: ['./tx-taxi-docs-intro.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TxTaxiDocsIntroComponent implements OnInit {
  @Input() context = 'documentation';
  @Input() chainName = '';
  @Input() chainHost = '';
  hubUrl = 'https://tx.taxi/';

  constructor(@Inject(LOCALE_ID) private locale: string, private changeDetector: ChangeDetectorRef) {}

  ngOnInit(): void {
    refreshLocalizedCapabilities('https://tx.taxi').then(() => {
      this.hubUrl = localizedNativeUrl('https://tx.taxi/', this.locale.slice(0, 2));
      this.changeDetector.markForCheck();
    });
  }
}
