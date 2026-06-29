import { Entity, PrimaryKey, Property } from "@mikro-orm/mongodb";
import { ObjectId } from '@mikro-orm/mongodb'

@Entity({
  collection: 'feeds'
})
class Feed {
  @PrimaryKey()
  _id!: ObjectId;

  @Property({ nullable: true })
  disabled?: string;
}

export default Feed
