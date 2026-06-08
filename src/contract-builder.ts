/**
 * Конструктор тела запроса для создания договора.
 *
 * Инкапсулирует правила обязательности полей по типу договора и проверяет их в
 * {@link ContractBuilder.build} до отправки, чтобы вместо ответа 400 вернуть
 * понятную ошибку валидации.
 *
 * Правила по типу:
 * - `service`      — обязательны subject, isReportingRequired, date, number; запрещён cid.
 * - `intermediary` — дополнительно обязательны object, isFundsAllocationToPrincipal; запрещён cid.
 * - `external`     — обязателен cid; запрещён parentId; date/number необязательны.
 *
 * Поле `intermediary` (данные исполнителя) обязательно, если не задан parentId,
 * и недопустимо, если parentId задан (доп. соглашение).
 */

import {
  assertEnum,
  ContractType,
  validContractActions,
  validContractSubjects,
  validContractTypes,
  validCounterpartyTypes,
} from './enums.js';
import { ValidationError } from './errors.js';

export class ContractBuilder {
  private data: Record<string, unknown> = {};

  /** Создаёт пустой конструктор. */
  static create(): ContractBuilder {
    return new ContractBuilder();
  }

  /** Конструктор договора на оказание услуг. */
  static service(): ContractBuilder {
    return new ContractBuilder().type(ContractType.Service);
  }

  /** Конструктор посреднического договора. */
  static intermediaryContract(): ContractBuilder {
    return new ContractBuilder().type(ContractType.Intermediary);
  }

  /** Конструктор внешнего договора. */
  static external(cid: string): ContractBuilder {
    return new ContractBuilder().type(ContractType.External).cid(cid);
  }

  advertiser(advertiserId: number): this {
    this.data.advertiserId = advertiserId;
    return this;
  }

  type(value: string): this {
    this.data.type = assertEnum(value, validContractTypes, 'ContractType');
    return this;
  }

  counterpartyType(value: string): this {
    this.data.description = assertEnum(value, validCounterpartyTypes, 'ContractCounterpartyType');
    return this;
  }

  subject(value: string): this {
    this.data.subject = assertEnum(value, validContractSubjects, 'ContractSubject');
    return this;
  }

  object(value: string): this {
    this.data.object = assertEnum(value, validContractActions, 'ContractAction');
    return this;
  }

  cid(cid: string): this {
    this.data.cid = cid;
    return this;
  }

  /** Дата в формате YYYY-MM-DD. */
  date(date: string): this {
    this.data.date = date;
    return this;
  }

  number(number: string): this {
    this.data.number = number;
    return this;
  }

  reportingRequired(value: boolean): this {
    this.data.isReportingRequired = value;
    return this;
  }

  fundsAllocationToPrincipal(value: boolean): this {
    this.data.isFundsAllocationToPrincipal = value;
    return this;
  }

  parentId(parentId: number): this {
    this.data.parentId = parentId;
    return this;
  }

  /** Данные исполнителя (посредника). */
  intermediary(data: Record<string, unknown>): this {
    this.data.intermediary = data;
    return this;
  }

  /**
   * Проверяет правила по типу договора и возвращает тело запроса.
   *
   * @throws {@link ValidationError} при нарушении правил.
   */
  build(): Record<string, unknown> {
    this.require('advertiserId', 'Не задан advertiserId.');
    this.require('type', 'Не задан type договора.');
    this.require('description', 'Не задан тип контрагента (counterpartyType).');

    const contractType = this.data.type as string;
    const hasParent = 'parentId' in this.data;

    if (contractType === ContractType.External) {
      this.require('cid', 'Для внешнего договора (external) обязателен cid.');
      if (hasParent) {
        throw new ValidationError('Для внешнего договора (external) нельзя передавать parentId.');
      }
    }

    if (contractType === ContractType.Service || contractType === ContractType.Intermediary) {
      for (const key of ['subject', 'isReportingRequired', 'date', 'number']) {
        this.require(
          key,
          `Для договора типа ${contractType} обязательны subject, isReportingRequired, date, number.`,
        );
      }
      if ('cid' in this.data) {
        throw new ValidationError(`Для договора типа ${contractType} нельзя передавать cid.`);
      }
    }

    if (contractType === ContractType.Intermediary) {
      this.require('object', 'Для посреднического договора обязателен object.');
      this.require(
        'isFundsAllocationToPrincipal',
        'Для посреднического договора обязателен isFundsAllocationToPrincipal.',
      );
    }

    const hasIntermediary = 'intermediary' in this.data;
    if (hasParent && hasIntermediary) {
      throw new ValidationError(
        'Для доп. соглашения (задан parentId) нельзя передавать intermediary.',
      );
    }
    if (!hasParent && !hasIntermediary) {
      throw new ValidationError(
        'Не задан parentId — необходимо передать данные исполнителя (intermediary).',
      );
    }

    return { ...this.data };
  }

  private require(key: string, message: string): void {
    if (!(key in this.data)) {
      throw new ValidationError(message);
    }
  }
}
