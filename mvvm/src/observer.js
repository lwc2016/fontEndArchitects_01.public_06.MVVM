// 数据劫持或数据响应式
import Dep from "./dep";

export default class Observer{
    constructor(data){
        this.observe(data);
    }
    observe(data){
        // 如果data为空，或者不是个对象，则直接返回
        if(!data || typeof data !== "object"){
            return;
        }
        Object.keys(data).forEach(key => {
            this.observe(data[key]);
            this.defineReactive(data, key, data[key]);
        });
    }
    defineReactive(data, key, value){
        const that = this;
        const dep = new Dep(key);
        Object.defineProperty(data, key, {
            enumerable: true,
            configurable: true,
            get(){
                Dep.target && dep.addListener(Dep.target);
                return value;
            },
            set(newValue){
                if(newValue != value){
                    that.observe(newValue);
                    value = newValue;
                    dep.notify();  // 通知更新
                }
            }
        })
    }
}