# notes on TS5 new Decorator

## Typescript 5 Release

* [TS5 release announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-5-0/#decorators)


## [overview article](https://2ality.com/2022/10/javascript-decorators.html)

* typed decorator
```typescript
type Decorator = (
  value: DecoratedValue, // only fields differ
  context: {
    kind: string;
    name: string | symbol;
    addInitializer(initializer: () => void): void;

    // Don’t always exist:
    static: boolean;
    private: boolean;
    access: {get: () => unknown, set: (value: unknown) => void};
  }
) => void | ReplacementValue; // only fields differ
```

* How are decorators executed?

  - Evaluation: The expressions after the @ symbols are evaluated during the execution of the class definition, along with computed property keys and static fields (see code below). The results must be functions. They are stored in temporary locations (think local variables), to be invoked later.

  - Invocation: The decorator functions are called later during the execution of a class definition, after methods have been evaluated but before constructor and prototype have been assembled. Once again the results are stored in temporary locations.

  - Application: After all decorator functions were invoked, their results are used, which can affect constructor and prototype. Class decorators are applied after all method and field decorators.

* The following code illustrates in which order decorator expressions, computed property keys and field initializers are evaluated:

```typescript
function decorate(str) {
  console.log(`EVALUATE @decorate(): ${str}`);
  return () => console.log(`APPLY @decorate(): ${str}`); // (A)
}
function log(str) {
  console.log(str);
  return str;
}

@decorate('class')
class TheClass {

  @decorate('static field')
  static staticField = log('static field value');

  @decorate('prototype method')
  [log('computed key')]() {}

  @decorate('instance field')
  instanceField = log('instance field value');
    // This initializer only runs if we instantiate the class
}

// Output:
// EVALUATE @decorate(): class
// EVALUATE @decorate(): static field
// EVALUATE @decorate(): prototype method
// computed key
// EVALUATE @decorate(): instance field
// APPLY @decorate(): prototype method
// APPLY @decorate(): static field
// APPLY @decorate(): instance field
// APPLY @decorate(): class
// static field value
```

