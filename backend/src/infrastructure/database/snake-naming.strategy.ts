import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';

function snake(value: string) {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/__/g, '_').toLowerCase();
}

export class SnakeNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  tableName(className: string, customName: string) {
    return customName ? customName : snake(className);
  }

  columnName(propertyName: string, customName: string, embeddedPrefixes: string[]) {
    return snake([...embeddedPrefixes, customName || propertyName].join('_'));
  }
}
