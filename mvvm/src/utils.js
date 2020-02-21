// 获取值
export const getValue = (vm, expr) => {
    const exprs = expr.split(".");
    return exprs.reduce((total, item) => {
        return total[item];
    }, vm.$data);
};

// 添加值
export const setValue = (vm, expr, value) => {
    const exprs = expr.split(".");
    exprs.reduce((total, item, index) => {
        if(index === exprs.length - 1){
            total[item] = value;
        }else{
            return total[item];
        }
    }, vm.$data);
};