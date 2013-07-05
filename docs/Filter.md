A filter is a JSON structure use to decide if a hMessage must be deliver or ignore.
This structure is an hCondition which describe when a hMessage is correct or not.

## hCondition

A hCondition is an object starting with an operand among `eq, ne, gt, gte, lt, lte, in, nin, and, or, nor, relevant, geo, domain`.
Then the structure depend of the operand

### Operand "eq" - "ne" - "gt" - "gte" - "lt" - "lte"

There operand attribute is an hValue which describe the name of an attribute and his value :

```js
{
    eq : { priority : 2 }
} // The priority of the hMessage must equal 2

{
    eq : { priority : 2, timeout : 1000 }
} // The priority of the hMessage must equal 2 AND the timeout must equal 1000

{
    gt : { priority : 1 },
    lt : { priority : 4 }
} // The priority of the hMessage must be greater than 1 AND lower than 4

{
    gt : { location.pos.lat : 20 },
    lt : { location.pos.lat : 40
} // The location of the hMessage must have a latitude between 20 and 40
```

### Operand "in" - "nin"

There operand attribute is an hArrayOfValue which describe the name of an attribute and an array of there value :

```js
{
    in : { publisher : ['urn:localhost:user1', 'urn:localhost:user2'] }
} // The publisher of the hMessage must be urn:localhost:user1 or urn:localhost:user2

{
    in : { publisher : ['urn:localhost:user1', 'urn:localhost:user2'], author : ['urn:localhost:user1', 'urn:localhost:user2'] }
} // The publisher of the hMessage must be urn:localhost:user1 or urn:localhost:user2 AND the author of the hMessage must be urn:localhost:user1 or urn:localhost:user2

{
    in : { publisher : ['urn:localhost:user1', 'urn:localhost:user2'] },
    nin : { author : ['urn:localhost:user3', 'urn:localhost:user4'] }
} // The publisher of the hMessage must be urn:localhost:user1 or urn:localhost:user2 AND the author of the hMessage must not be urn:localhost:user3 or urn:localhost:user4

{
    eq : { type : 'hCommand' },
    in : { payload.cmd : ['hSubscribe', 'hUnsubscribe'] }
} // The type of the hMessage must be hCommand AND the cmd attribute of the payload must be hSubscribe or hUnsubscribe
```

### Operand "and" - "or" - "nor"

There operand attribute is an Array which contain at least 2 hCondition :

```js
{
    and : [
           {eq : { priority : 2 }},
           {in : { publisher : ['urn:localhost:user1', 'urn:localhost:user2'] }}
          ]
} // The priority of the hMessage must equal 2 AND The publisher of the hMessage must be user1@domain or user2@domain

{
    or : [
          {eq : { priority : 2 }},
          {in : { publisher : ['urn:localhost:user1', 'urn:localhost:user2'] }}
         ]
} // The priority of the hMessage must equal 2 OR The publisher of the hMessage must be user1@domain or user2@domain

{
    nor : [
           {eq : { priority : 2 }},
           {in : { publisher : ['urn:localhost:user1', 'urn:localhost:user2'] }}
          ]
} // The priority of the hMessage must not equal 2 AND The publisher of the hMessage must not be urn:localhost:user1 or urn:localhost:user2
```

### Operand "not"

There operand attribute is a hCondition :

```js
{
    not : { eq : { priority : 2 } }
} // The priority of the hMessage must not equal 2

{
    not : {
           eq : { priority : 2 },
           in : { publisher : ['urn:localhost:user1', 'urn:localhost:user2'] }
          }
} // The priority of the hMessage must not equal 2 OR The publisher of the hMessage must not be urn:localhost:user1 or urn:localhost:user2
```

### Operand "relevant" - "boolean"

There operand attribute is a boolean :

```js
{
    relevant: true
} // The hMessage must be relevant

{
    relevant: false
} // The hMessage must not be relevant

{
    boolean: false
} // Any hMessage will be reject

{
    boolean: true
} // Any hMessage will be accept (like an empty filter : {})
```

### Operand "geo"

There operand attribute is a hPos :

```js
{
    geo: {
          lat: 48,
          lng: 2,
          radius: 10000
         }
} // The position of the hMessage must be 10 000m around this point(lat/lng)
```

### Operand "domain"

There operand attribute is a string :

```js
{
    domain: 'myproject.domain.com'
} // The domain of the publisher of the hMessage must be 'myproject.domain.com'

{
    domain: '$mydomain'
} // The domain of the publisher of the hMessage must be the same as mine
```

## How set a filter
To put à filter on a client session level you can use the function SetFilter.
* For more details you can see [Fonctions](https://github.com/hubiquitus/hubiquitus4js/tree/master/Functions.md)