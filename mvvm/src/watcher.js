// watcher，观察者的目的是给需要变化的那个元素增加一个观察者，当数据变化时调用对应的方法
import { getValue } from "./utils";

export default class Watcher{
    constructor(vm, expr, callback){
        this.vm = vm;
        this.expr = expr;
        this.callback = callback;
        // 存储旧值
        this.value = getValue(this.vm, this.expr);
    }
    // 对外暴露的方法
    update(){
        // 获取最新的值
        const newValue = getValue(this.vm, this.expr);
        // 比较新值和旧值是否相等，如果不等则执行回调函数
        if(this.value !== newValue){
            this.callback && this.callback(newValue);
        }
    }
};