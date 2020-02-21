export default class Dep{
    constructor(key){
        // 监听事件的列表
        this.listeners = [];
        this.uid = (Math.random() * 10000000).toFixed(0);
    }
    // 默认target是空的
    static target = null;
    // 添加监听函数
    addListener(listener){
        if(!this.listeners.includes(listener)){
            this.listeners.push(listener);
        }
    }
    // 当数据变化时，通知函数
    notify(){
        //依次执行监听对象的update方法
        this.listeners.forEach(listener => listener.update());
    }
}