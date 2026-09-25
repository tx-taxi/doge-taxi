import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
@Component({selector:'app-cross-chain-redirect',standalone:false,template:`<div class="container-xl py-5"><h1>Continue to {{chain}}</h1><p>You are leaving the Dogecoin explorer.</p><p style="overflow-wrap:anywhere">{{value}}</p><label><input type="checkbox" (change)="remember=$any($event.target).checked"> Never ask again when leaving Dogecoin</label><p class="mt-4"><button class="btn btn-primary" [style.backgroundColor]="accents[chain]" [style.borderColor]="accents[chain]" (click)="confirm()">Continue</button> <a class="btn btn-secondary" routerLink="/">Back to Dogecoin</a></p></div>`})
export class CrossChainRedirectComponent {
 accents:any={bitcoin:'#f7931a',ethereum:'#627eea',monero:'#ff6600'};
 chain='';value='';kind='';remember=false;
 hosts:any={bitcoin:'btc.tx.taxi',ethereum:'eth.tx.taxi',monero:'xmr.tx.taxi'};
 constructor(route:ActivatedRoute){route.params.subscribe(p=>{this.chain=p.chain;this.value=p.value;this.kind=p.kind;if(localStorage.getItem('ltc-confirm-leaving')==='false')this.confirm();});}
 confirm(){if(!this.hosts[this.chain]||!['tx','block','address'].includes(this.kind)||!/^[a-zA-Z0-9]+$/.test(this.value))return;if(this.remember)localStorage.setItem('ltc-confirm-leaving','false');window.location.href='https://'+this.hosts[this.chain]+'/'+this.kind+'/'+encodeURIComponent(this.value);}
}
