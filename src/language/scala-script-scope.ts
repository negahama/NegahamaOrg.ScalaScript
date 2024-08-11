import { AstUtils, DefaultScopeProvider, EMPTY_SCOPE, ReferenceInfo, Scope } from "langium";
import { Class, isClass, MemberCall } from "./generated/ast.js";
import { LangiumServices } from "langium/lsp";

export class ScalaScriptScopeProvider extends DefaultScopeProvider {
  constructor(services: LangiumServices) {
    super(services);
  }

  override getScope(context: ReferenceInfo): Scope {
    // target element of member calls
    if (context.property === "element") {
      // for now, `this` and `super` simply target the container class type
      if (context.reference.$refText === "this" || context.reference.$refText === "super") {
        const classItem = AstUtils.getContainerOfType(context.container, isClass);
        if (classItem) {
          console.log("scala-script-scope::getScope is invoked:", context.property, context.reference.$refText);
          return this.scopeClassMembers(classItem);
        } else {
          return EMPTY_SCOPE;
        }
      }
      const memberCall = context.container as MemberCall;
      const previous = memberCall.previous;
      if (!previous) {
        return super.getScope(context);
      }
      // const previousType = inferType(previous, new Map());
      // if (previousType.$type === "class") {
      //   return this.scopeClassMembers(previousType.literal);
      // }
      // return EMPTY_SCOPE;
      return super.getScope(context);
    }
    return super.getScope(context);
  }

  private scopeClassMembers(classItem: Class): Scope {
    const allMembers = this.getClassChain(classItem).flatMap((e) => e.members);
    console.log(allMembers.map((m) => m.name));
    return this.createScopeForNodes(allMembers);
  }

  private getClassChain(classItem: Class): Class[] {
    const set = new Set<Class>();
    let value: Class | undefined = classItem;
    while (value && !set.has(value)) {
      set.add(value);
      value = value.superClass?.ref;
    }
    // Sets preserve insertion order
    return Array.from(set);
  }
}
