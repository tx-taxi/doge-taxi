import { Component, Input } from '@angular/core';
import { StateService } from '@app/services/state.service';
@Component({selector:'app-difficulty',templateUrl:'./difficulty.component.html',styleUrls:['./difficulty.component.scss'],standalone:false})
export class DifficultyComponent {
 @Input() showTitle=true; @Input() showProgress=true; @Input() showHalving=false;
 @Input() set initialMode(value: string) { this.mode = value; }
 mode='network'; blocks$=this.stateService.blocks$;
 gapRemaining(seconds:number) { return 100-Math.min(100,Math.max(0,seconds/60*100)); }
 constructor(public stateService:StateService){}
}
