/** Создание посреднического договора через ContractBuilder. */
import {
  AvitoAdsClient,
  ContractBuilder,
  ContractCounterpartyType,
  ContractSubject,
  ContractAction,
  LegalType,
} from '../src/index.js';

async function main(): Promise<void> {
  const client = AvitoAdsClient.fromEnv();

  const builder = ContractBuilder.intermediaryContract()
    .advertiser(987654321)
    .counterpartyType(ContractCounterpartyType.DirectWithAdvertiser)
    .subject(ContractSubject.Mediation)
    .object(ContractAction.Commercial)
    .reportingRequired(true)
    .fundsAllocationToPrincipal(false)
    .date('2025-01-15')
    .number('ДА-2025/01')
    .intermediary({
      shortName: 'ООО Реклама',
      longName: 'Общество с ограниченной ответственностью «Реклама»',
      inn: '7712345678',
      ogrn: '1177746123456',
      kpp: '771701001',
      legalAddress: 'г. Москва, ул. Примерная, д. 1',
      actualAddress: 'г. Москва, ул. Примерная, д. 1',
      legalType: LegalType.UL,
    });

  const created = await client.contracts.create(builder);
  console.log(`Создан договор ID: ${created.id}`);
}

void main();
