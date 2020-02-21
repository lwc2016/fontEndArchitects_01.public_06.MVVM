// 创建MVVM类
import Compile from "./compile";
import Observer from "./observer";

export default class MVVM{
    constructor(options){
        // 解析参数，将参数挂载到实例上
        this.$options = options;
        this.$el = options.el;
        this.$data = options.data;
        
        // 数据劫持/数据响应式
        new Observer(this.$data);
        // 将数据代理到实例上
        this.proxyData(this.$data);
        // 判断el是否存在，如果存在则执行编译工作
        if(this.$el){
            new Compile(this.$el, this);
        }
    }
    // 将数据代理到this上
    proxyData(data){
        Object.keys(data).forEach(key => {
            Object.defineProperty(this, key, {
                enumerable: true,
                configurable: true,
                get(){
                    return this.$data[key];
                },
                set(newValue){
                    this.$data[key] = newValue;
                }
            })
        });
    }
}

window.MVVM = MVVM;