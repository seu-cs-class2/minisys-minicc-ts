/**
 * 目标代码生成相关定义
 * 2021-01 @ https://github.com/seu-cs-class2/minisys-minicc-ts
 */

export interface RegisterDescriptor {
    recent: number
    variables: Set<string>
}

export interface AddressDescriptor {
    addresses: Set<string>
}