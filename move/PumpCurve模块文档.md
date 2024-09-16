

# Pump Curve 模块文档

## 结构体

### BondingCurve

```rust
public struct BondingCurve<phantom T> has key {
    id: UID,  // 唯一标识符
    sui_balance: balance::Balance<SUI>,  // SUI 代币余额
    token_balance: balance::Balance<T>,  // 其他代币余额
    virtual_sui_amt: u64,  // 虚拟 SUI 代币数量
    target_supply_threshold: u64,  // 目标供应阈值
    swap_fee: u64,  // 交换费用
    is_active: bool,  // 是否激活
    creator: address,  // 创建者地址
    twitter: option::Option<ascii::String>,  // 推特信息
    telegram: option::Option<ascii::String>,  // 电报信息
    website: option::Option<ascii::String>,  // 网站信息
    migration_target: u64,  // 迁移目标
}
```

### Configurator 配置器

```rust
public struct Configurator has key {
    id: UID,  // 唯一标识符
    virtual_sui_amt: u64,  // 虚拟 SUI 代币数量
    target_supply_threshold: u64,  // 目标供应阈值
    migration_fee: u64,  // 迁移费用
    listing_fee: u64,  // 上市费用
    swap_fee: u64,  // 交换费用
    fee: balance::Balance<SUI>,  // 费用余额
}
```

### BondingCurveListedEvent

```rust
public struct BondingCurveListedEvent has copy, drop {
    object_id: object::ID,  // 对象 ID
    token_type: ascii::String,  // 代币类型
    sui_balance_val: u64,  // SUI 余额值
    token_balance_val: u64,  // 代币余额值
    virtual_sui_amt: u64,  // 虚拟 SUI 代币数量
    target_supply_threshold: u64,  // 目标供应阈值
    creator: address,  // 创建者地址
    ticker: ascii::String,  // 代码
    name: string::String,  // 名称
    description: string::String,  // 描述
    url: option::Option<0x2::url::Url>,  // URL
    coin_metadata_id: object::ID,  // 代币元数据 ID
    twitter: option::Option<ascii::String>,  // 推特信息
    telegram: option::Option<ascii::String>,  // 电报信息
    website: option::Option<ascii::String>,  // 网站信息
    migration_target: u64,  // 迁移目标
}
```

### Points

```rust
public struct Points has copy, drop {
    amount: u64,  // 数量
    sender: address,  // 发送者地址
}
```

### SwapEvent

```rust
public struct SwapEvent has copy, drop {
    bc_id: object::ID,  // 债券曲线 ID
    token_type: ascii::String,  // 代币类型
    is_buy: bool,  // 是否是购买
    input_amount: u64,  // 输入数量
    output_amount: u64,  // 输出数量
    sui_reserve_val: u64,  // SUI 储备值
    token_reserve_val: u64,  // 代币储备值
    sender: address,  // 发送者地址
}
```

### MigrationPendingEvent

```rust
public struct MigrationPendingEvent has copy, drop {
    bc_id: object::ID,  // 债券曲线 ID
    token_type: ascii::String,  // 代币类型
    sui_reserve_val: u64,  // SUI 储备值
    token_reserve_val: u64,  // 代币储备值
}
```

### MigrationCompletedEvent

```rust
public struct MigrationCompletedEvent has copy, drop {
    adapter_id: u64,  // 适配器 ID
    bc_id: object::ID,  // 债券曲线 ID
    token_type: ascii::String,  // 代币类型
    target_pool_id: object::ID,  // 目标池 ID
    sui_balance_val: u64,  // SUI 余额值
    token_balance_val: u64,  // 代币余额值
}
```

### AdminCap

```rust
public struct AdminCap has store, key {
    id: UID,  // 唯一标识符
}
```

## 函数

### 公共函数

### transfer

```rust
public fun transfer<T>(arg0: BondingCurve<T>) {
    transfer::share_object<BondingCurve<T>>(arg0);
}
```

- **arg0**: `BondingCurve<T>` - 债券曲线对象

### freeze_tr

```rust
public fun freeze_tr<T>(
    arg1: coin::TreasuryCap<T>,
    arg2: &mut tx_context::TxContext
) {
    freezer::freeze_object<coin::TreasuryCap<T>>(arg1, arg2);
}
```

- **arg1**: `coin::TreasuryCap<T>` - 代币财政上限对象
- **arg2**: `&mut tx_context::TxContext` - 交易上下文

### freeze_meta

```rust
public fun freeze_meta<T>(
    arg1: coin::CoinMetadata<T>,
    arg2: &mut tx_context::TxContext
) {
    freezer::freeze_object<coin::CoinMetadata<T>>(arg1, arg2);
}
```

- **arg1**: `coin::CoinMetadata<T>` - 代币元数据对象
- **arg2**: `&mut tx_context::TxContext` - 交易上下文

### buy

```rust
public fun buy<T>(
    arg0: &mut BondingCurve<T>, 
    arg1: &mut Configurator, 
    arg2: coin::Coin<SUI>, 
    arg3: u64, 
    arg4: &mut tx_context::TxContext
) : coin::Coin<T>
```

- **arg0**: `&mut BondingCurve<T>` - 可变的债券曲线对象
- **arg1**: `&mut Configurator` - 可变的配置器对象
- **arg2**: `coin::Coin<SUI>` - SUI 代币对象
- **arg3**: `u64` - 输入的 SUI 数量
- **arg4**: `&mut tx_context::TxContext` - 交易上下文

### confirm_migration

```rust
public fun confirm_migration(
    _arg0: &AdminCap, 
    arg1: u64, 
    arg2: object::ID, 
    arg3: ascii::String, 
    arg4: object::ID, 
    arg5: u64, 
    arg6: u64
)
```

- **_arg0**: `&AdminCap` - 管理权限对象
- **arg1**: `u64` - 适配器 ID
- **arg2**: `object::ID` - 债券曲线 ID
- **arg3**: `ascii::String` - 代币类型
- **arg4**: `object::ID` - 目标池 ID
- **arg5**: `u64` - SUI 余额值
- **arg6**: `u64` - 代币余额值

### list

```rust
public fun list<T>(
    arg0: &mut Configurator,
    arg1: &mut coin::TreasuryCap<T>,
    arg2: &coin::CoinMetadata<T>,
    arg3: coin::Coin<SUI>,
    arg4: option::Option<ascii::String>,
    arg5: option::Option<ascii::String>,
    arg6: option::Option<ascii::String>,
    arg7: u64,
    arg8: &mut tx_context::TxContext
) : BondingCurve<T>
```

- **arg0**: `&mut Configurator` - 可变的配置器对象
- **arg1**: `&mut coin::TreasuryCap<T>` - 可变的代币财政上限对象
- **arg2**: `&coin::CoinMetadata<T>` - 代币元数据对象
- **arg3**: `coin::Coin<SUI>` - SUI 代币对象
- **arg4**: `option::Option<ascii::String>` - 推特信息
- **arg5**: `option::Option<ascii::String>` - 电报信息
- **arg6**: `option::Option<ascii::String>` - 网站信息
- **arg7**: `u64` - 虚拟 SUI 数量
- **arg8**: `&mut tx_context::TxContext` - 交易上下文

### migrate

```rust
public fun migrate<T>(
    _arg0: &AdminCap,
    arg1: &mut BondingCurve<T>,
    arg2: u64,
    arg3: &mut tx_context::TxContext
) : BondingCurve<T>
```

- **_arg0**: `&AdminCap` - 管理权限对象
- **arg1**: `&mut BondingCurve<T>` - 可变的债券曲线对象
- **arg2**: `u64` - 迁移目标
- **arg3**: `&mut tx_context::TxContext` - 交易上下文

### sell

```rust
public fun sell<T>(
    arg0: &mut BondingCurve<T>,
    arg1: &mut Configurator,
    arg2: coin::Coin<T>,
    arg3: u64,
    arg4: &mut tx_context::TxContext
) : coin::Coin<SUI>
```

- **arg0**: `&mut BondingCurve<T>` - 可变的债券曲线对象
- **arg1**: `&mut Configurator` - 可变的配置器对象
- **arg2**: `coin::Coin<T>` - 代币对象
- **arg3**: `u64` - 输入的代币数量
- **arg4**: `&mut tx_context::TxContext` - 交易上下文

### update_listing_fee

```rust
public fun update_listing_fee(
    _arg0: &AdminCap, 
    arg1: &mut Configurator, 
    arg2: u64
)
```

- **_arg0**: `&AdminCap` - 管理权限对象
- **arg1**: `&mut Configurator` - 可变的配置器对象
- **arg2**: `u64` - 上市费用

### update_migration_fee

```rust
public fun update_migration_fee(
    _arg0: &AdminCap, 
    arg1: &mut Configurator, 
    arg2: u64
)
```

- **_arg0**: `&AdminCap` - 管理权限对象
- **arg1**: `&mut Configurator` - 可变的配置器对象
- **arg2**: `u64` - 迁移费用

### update_target_supply_threshold

```rust
public fun update_target_supply_threshold(
    _arg0: &AdminCap, 
    arg1: &mut Configurator, 
    arg2: u64
)
```

- **_arg0**: `&AdminCap` - 管理权限对象
- **arg1**: `&mut Configurator` - 可变的配置器对象
- **arg2**: `u64` - 目标供应阈值

### update_virtual_sui_liq

```rust
public fun update_virtual_sui_liq(
    _arg0: &AdminCap, 
    arg1: &mut Configurator, 
    arg2: u64
)
```

- **_arg0**: `&AdminCap` - 管理权限对象
- **arg1**: `&mut Configurator` - 可变的配置器对象
- **arg2**: `u64` - 虚拟 SUI 数量





## 注释

- `buy` 函数允许用户通过指定的 SUI 数量购买代币。
- `sell` 函数允许用户将代币卖回债券曲线，并获得 SUI。
- `list` 函数创建新的债券曲线并在平台上列出。
- `migrate` 函数处理迁移。
- `update_listing_fee`, `update_migration_fee`, `update_target_supply_threshold`, 和 `update_virtual_sui_liq` 函数允许更新各种配置参数。
